
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

interface UserRoleRequest {
  userId: string;
  role: string;
}

// Create a Supabase client with the service role key for privileged operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      persistSession: false,
    }
  }
);

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
    
    // Verify the token to get user info
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', details: authError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userId, role } = await req.json() as UserRoleRequest;

    console.log(`Processing role update for user ${userId} to role: ${role}`);

    // Check if user is authorized (must be admin to change roles)
    const { data: adminCheck, error: adminCheckError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminCheckError || !adminCheck || !adminCheck.role.includes('admin')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, app_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error checking profile:", profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profile data', details: profileError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentRole = existingProfile?.role || '';
    const wasTrainer = currentRole.includes('trainer');
    const isBecomingTrainer = role.includes('trainer');

    // Create or update profile
    if (!existingProfile) {
      // Create new profile
      const { error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          role,
          app_id: APP_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createError) {
        console.error("Error creating profile:", createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create profile', details: createError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Update existing profile
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          role,
          app_id: APP_ID,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update profile', details: updateError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle trainer table synchronization
    if (isBecomingTrainer) {
      await syncTrainerRecord(userId, supabaseAdmin);
    } else if (wasTrainer && !isBecomingTrainer) {
      await removeTrainerRecord(userId, supabaseAdmin);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User role updated successfully to ${role}` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to sync trainer record
async function syncTrainerRecord(userId: string, supabase: any) {
  try {
    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;

    const nameParts = (profile?.full_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if trainer record exists
    const { data: existingTrainer, error: checkError } = await supabase
      .from('trainers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existingTrainer) {
      // Create new trainer record
      const { error: createError } = await supabase
        .from('trainers')
        .insert({
          user_id: userId,
          email: profile?.username || '',
          first_name: firstName,
          last_name: lastName,
          specialties: [],
        });

      if (createError) throw createError;
    }
    
    return true;
  } catch (error) {
    console.error("[syncTrainerRecord] Error:", error);
    throw error;
  }
}

// Helper function to remove trainer record
async function removeTrainerRecord(userId: string, supabase: any) {
  try {
    const { error } = await supabase
      .from('trainers')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("[removeTrainerRecord] Error:", error);
    throw error;
  }
}
