
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

const APP_ID = 'mckaynine'; // Match the APP_ID from your constants

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the auth token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with the service role key for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        }
      }
    );
    
    // Verify the token to get user info
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', details: authError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userId, role } = await req.json();

    console.log(`[manage-user-role] Processing role update for user ${userId} to role: ${role}`);

    // Check if user is authorized (must be admin to change roles)
    const { data: adminCheck, error: adminCheckError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminCheckError) {
      console.error("[manage-user-role] Error checking admin status:", adminCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin permissions', details: adminCheckError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!adminCheck || !adminCheck.role || !adminCheck.role.includes('admin')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user details from auth
    const { data: userData, error: userError } = await supabaseAdmin
      .auth.admin.getUserById(userId);
    
    if (userError || !userData?.user) {
      console.error("[manage-user-role] Error fetching user:", userError);
      return new Response(
        JSON.stringify({ error: 'Failed to get user information', details: userError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = userData.user.email;
    console.log(`[manage-user-role] User email: ${userEmail}`);
    
    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, app_id, full_name, username')
      .eq('id', userId)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("[manage-user-role] Error checking profile:", profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profile data', details: profileError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentRole = existingProfile?.role || '';
    const wasTrainer = currentRole.includes('trainer');
    const isBecomingTrainer = role.includes('trainer');
    
    // User's name from profile or email as fallback
    const fullName = existingProfile?.full_name || userEmail?.split('@')[0] || '';
    const username = existingProfile?.username || userEmail || '';

    // Create or update profile
    if (!existingProfile) {
      // Create new profile
      console.log("[manage-user-role] Creating new profile");
      const { error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          role: role,
          app_id: APP_ID,
          full_name: fullName,
          username: username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createError) {
        console.error("[manage-user-role] Error creating profile:", createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create profile', details: createError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Update existing profile
      console.log(`[manage-user-role] Updating existing profile from role '${currentRole}' to '${role}'`);
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          role: role,
          app_id: APP_ID,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error("[manage-user-role] Error updating profile:", updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update profile', details: updateError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle trainer table synchronization
    if (isBecomingTrainer) {
      console.log(`[manage-user-role] User is becoming a trainer, ensuring trainer record exists`);
      await syncTrainerRecord(userId, supabaseAdmin, username, fullName);
    } else if (wasTrainer && !isBecomingTrainer) {
      console.log(`[manage-user-role] User is no longer a trainer, handling trainer record`);
      await handleTrainerRecordRemoval(userId, supabaseAdmin);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User role updated successfully to ${role}`,
        userId,
        role
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("[manage-user-role] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to sync trainer record
async function syncTrainerRecord(userId: string, supabase: any, email: string, fullName: string) {
  try {
    // Parse name into first and last
    const nameParts = (fullName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if trainer record exists
    const { data: existingTrainer, error: checkError } = await supabase
      .from('trainers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error("[syncTrainerRecord] Error checking existing trainer:", checkError);
      throw checkError;
    }

    if (!existingTrainer) {
      console.log(`[syncTrainerRecord] Creating new trainer record for user_id ${userId} with name ${firstName} ${lastName}`);
      
      // Create new trainer record
      const { data: newTrainer, error: createError } = await supabase
        .from('trainers')
        .insert({
          user_id: userId,
          email: email || '',
          first_name: firstName,
          last_name: lastName,
          specialties: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error("[syncTrainerRecord] Error creating trainer record:", createError);
        throw createError;
      }
      
      console.log("[syncTrainerRecord] Successfully created trainer record:", newTrainer.id);
      return true;
    } else {
      console.log(`[syncTrainerRecord] Trainer record already exists for user_id ${userId}`);
      return true;
    }
  } catch (error) {
    console.error("[syncTrainerRecord] Error:", error);
    throw error;
  }
}

// Helper function to handle removal of trainer role
async function handleTrainerRecordRemoval(userId: string, supabase: any) {
  try {
    console.log(`[handleTrainerRecordRemoval] Processing trainer record for user_id ${userId}`);
    
    // First try to get the trainer record
    const { data: trainerRecord, error: getError } = await supabase
      .from('trainers')
      .select('id, user_id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (getError) {
      console.error("[handleTrainerRecordRemoval] Error finding trainer record:", getError);
      return false;
    }
    
    if (!trainerRecord) {
      console.log(`[handleTrainerRecordRemoval] No trainer record found for user_id ${userId}`);
      return true;
    }
    
    // We won't delete the trainer record, just unlink it from the user
    const { error } = await supabase
      .from('trainers')
      .update({ 
        user_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error("[handleTrainerRecordRemoval] Error unlinking trainer record:", error);
      throw error;
    }
    
    console.log(`[handleTrainerRecordRemoval] Successfully unlinked trainer record for user_id ${userId}`);
    return true;
  } catch (error) {
    console.error("[handleTrainerRecordRemoval] Error:", error);
    throw error;
  }
}
