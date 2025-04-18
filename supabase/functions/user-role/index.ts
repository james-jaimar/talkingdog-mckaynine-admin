
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

const APP_ID = 'mckaynine-training'; // Match the APP_ID from your constants

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    // We'll validate the auth token separately
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    // Get the auth token and validate it
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create a client with the user's token to verify their permissions
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: 'Invalid token', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is admin using the admin client
    const { data: adminCheck, error: adminCheckError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminCheckError) {
      console.error("Admin check error:", adminCheckError);
      return new Response(
        JSON.stringify({ error: 'Error checking admin status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!adminCheck?.role?.includes('admin')) {
      console.error("User is not an admin:", user.id);
      return new Response(
        JSON.stringify({ error: 'Only admins can perform this action' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const requestData = await req.json();
    
    // Handle different operations based on the request type
    if (requestData.operation === 'create_user') {
      return await handleCreateUser(requestData, supabaseAdmin, corsHeaders);
    } else if (requestData.operation === 'reset_password') {
      return await handleResetPassword(requestData, supabaseAdmin, corsHeaders);
    } else {
      // Default to role update operation
      return await handleRoleUpdate(requestData, supabaseAdmin, corsHeaders);
    }

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Function to handle user creation
async function handleCreateUser(data, supabase, corsHeaders) {
  const { email, password, fullName, role } = data;
  
  if (!email || !password || !role) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields for user creation' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    console.log("Creating user with email:", email);
    
    // Create the user via admin API
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });
    
    if (createError) {
      console.error("User creation error:", createError);
      throw createError;
    }
    
    if (!userData.user) {
      throw new Error("User creation failed");
    }
    
    const userId = userData.user.id;
    console.log("User created with ID:", userId);
    
    // Update the profile with role and app_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        full_name: fullName,
        role: role,
        app_id: APP_ID,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (profileError) {
      console.error("Profile update error:", profileError);
      throw profileError;
    }
    
    // Handle trainer record creation if applicable
    if (role.includes('trainer')) {
      await createTrainerRecord(supabase, userId, email, fullName);
    }
    
    return new Response(
      JSON.stringify({ success: true, user: userData.user }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Create user error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error creating user' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Function to handle password resets
async function handleResetPassword(data, supabase, corsHeaders) {
  const { userId, password } = data;
  
  if (!userId || !password) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields for password reset' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    console.log("Resetting password for user:", userId);
    
    // Update user's password using admin API
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: password
    });
    
    if (error) {
      console.error("Password reset error:", error);
      throw error;
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Password reset error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error resetting password' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Function to handle role updates
async function handleRoleUpdate(data, supabase, corsHeaders) {
  const { userId, role } = data;
  if (!userId || !role) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields for role update' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get current role to check for changes
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    const wasTrainer = currentUser?.role?.includes('trainer');
    const isBecomingTrainer = role.includes('trainer');

    // Update user's role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role,
        app_id: APP_ID,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error("Role update error:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle trainer record changes
    if (isBecomingTrainer && !wasTrainer) {
      // Get user details to create trainer record
      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', userId)
        .single();
      
      if (userData) {
        await createTrainerRecord(supabase, userId, userData.username || '', userData.full_name || '');
      }
    } 
    else if (wasTrainer && !isBecomingTrainer) {
      // Unlink trainer record if user is no longer a trainer
      await supabase
        .from('trainers')
        .update({ 
          user_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Role update error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Helper function to create trainer record
async function createTrainerRecord(supabase, userId, email, fullName) {
  try {
    const names = fullName.split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';
    
    const { error: trainerError } = await supabase
      .from('trainers')
      .insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (trainerError) {
      console.error("Error creating trainer record:", trainerError);
    }
  } catch (error) {
    console.error("Trainer record creation error:", error);
  }
}
