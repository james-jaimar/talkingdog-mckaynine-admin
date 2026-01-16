import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is admin
    const { data: adminCheck } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminCheck?.role?.includes('admin')) {
      return new Response(
        JSON.stringify({ error: 'Only admins can manage handler accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData = await req.json();
    const { operation } = requestData;

    switch (operation) {
      case 'create_account':
        return await handleCreateAccount(requestData, supabaseAdmin);
      case 'remove_account':
        return await handleRemoveAccount(requestData, supabaseAdmin);
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown operation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleCreateAccount(data: any, supabase: any) {
  const { handlerId, email, password } = data;
  
  if (!handlerId || !email || !password) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get handler info
    const { data: handler, error: handlerError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, auth_user_id')
      .eq('id', handlerId)
      .single();

    if (handlerError || !handler) {
      throw new Error('Handler not found');
    }

    if (handler.auth_user_id) {
      throw new Error('Handler already has a login account');
    }

    // Create auth user
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        full_name: `${handler.first_name} ${handler.last_name}`,
        signup_intent: 'handler'
      }
    });

    if (createError) throw createError;
    if (!userData.user) throw new Error('User creation failed');

    const authUserId = userData.user.id;

    // Update profile with handler role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: 'handler',
        full_name: `${handler.first_name} ${handler.last_name}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', authUserId);

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    // Link auth user to handler
    const { error: linkError } = await supabase
      .from('clients')
      .update({ 
        auth_user_id: authUserId,
        onboarding_status: 'completed'
      })
      .eq('id', handlerId);

    if (linkError) {
      // Rollback: delete the auth user
      await supabase.auth.admin.deleteUser(authUserId);
      throw linkError;
    }

    // Create handler_onboarding record
    await supabase
      .from('handler_onboarding')
      .upsert({
        user_id: authUserId,
        client_id: handlerId,
        status: 'completed',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    // Add handler role to user_roles table
    await supabase
      .from('user_roles')
      .upsert({
        user_id: authUserId,
        role: 'handler'
      }, { onConflict: 'user_id,role' });

    return new Response(
      JSON.stringify({ success: true, authUserId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Create account error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error creating account' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleRemoveAccount(data: any, supabase: any) {
  const { handlerId } = data;
  
  if (!handlerId) {
    return new Response(
      JSON.stringify({ error: 'Missing handlerId' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get handler with auth_user_id
    const { data: handler, error: handlerError } = await supabase
      .from('clients')
      .select('auth_user_id')
      .eq('id', handlerId)
      .single();

    if (handlerError || !handler) {
      throw new Error('Handler not found');
    }

    if (!handler.auth_user_id) {
      throw new Error('Handler does not have a login account');
    }

    const authUserId = handler.auth_user_id;

    // Unlink auth user from handler
    const { error: unlinkError } = await supabase
      .from('clients')
      .update({ auth_user_id: null })
      .eq('id', handlerId);

    if (unlinkError) throw unlinkError;

    // Remove handler_onboarding record
    await supabase
      .from('handler_onboarding')
      .delete()
      .eq('user_id', authUserId);

    // Remove user_roles record
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', authUserId)
      .eq('role', 'handler');

    // Delete profile
    await supabase
      .from('profiles')
      .delete()
      .eq('id', authUserId);

    // Delete auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authUserId);
    
    if (deleteError) {
      console.error('Auth user deletion error:', deleteError);
      // Don't throw - the link is already removed
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Remove account error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error removing account' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
