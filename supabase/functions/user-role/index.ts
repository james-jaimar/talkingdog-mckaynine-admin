
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

const APP_ID = 'mckaynine-training'; // Match the APP_ID from your constants

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    // Verify the token and check admin status
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is admin
    const { data: adminCheck } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminCheck?.role?.includes('admin')) {
      return new Response(
        JSON.stringify({ error: 'Only admins can update user roles' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body and get parameters
    const { userId, role } = await req.json();
    if (!userId || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        const fullName = userData.full_name || '';
        const email = userData.username || '';
        
        // Parse name into first and last
        const names = fullName.split(' ');
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';

        // Create trainer record
        await supabase
          .from('trainers')
          .insert({
            user_id: userId,
            email,
            first_name: firstName,
            last_name: lastName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
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
    console.error("User role error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
