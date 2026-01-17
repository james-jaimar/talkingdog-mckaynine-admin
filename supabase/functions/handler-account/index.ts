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
        return await handleCreateAccount(requestData, supabaseAdmin, user.id);
      case 'reset_password':
        return await handleResetPassword(requestData, supabaseAdmin, user.id);
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

async function handleCreateAccount(data: any, supabase: any, requesterId: string) {
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

    // SECURITY: Check if email is already used by an admin/trainer
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, role, username')
      .eq('username', email)
      .single();

    if (existingProfile) {
      if (existingProfile.role?.includes('admin') || existingProfile.role?.includes('trainer') || existingProfile.role?.includes('platform_admin')) {
        console.error(`BLOCKED: Attempt to create handler account with admin/trainer email: ${email} by requester: ${requesterId}`);
        throw new Error('This email is already associated with an admin or trainer account');
      }
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
    console.log(`Handler account created: ${handler.first_name} ${handler.last_name} (${email}) by requester: ${requesterId}`);

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

async function handleResetPassword(data: any, supabase: any, requesterId: string) {
  const { handlerId, password } = data;
  
  if (!handlerId || !password) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields (handlerId, password)' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get handler with auth_user_id
    const { data: handler, error: handlerError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, auth_user_id')
      .eq('id', handlerId)
      .single();

    if (handlerError || !handler) {
      throw new Error('Handler not found');
    }

    if (!handler.auth_user_id) {
      throw new Error('Handler does not have a login account');
    }

    const authUserId = handler.auth_user_id;

    // CRITICAL SECURITY CHECK: Verify target user is a handler, NOT admin/trainer
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, username, full_name')
      .eq('id', authUserId)
      .single();

    if (profileError || !targetProfile) {
      console.error(`Password reset blocked: Could not find profile for auth_user_id ${authUserId}`);
      throw new Error('User profile not found - cannot verify user role');
    }

    // Block if target is admin, trainer, or platform_admin
    const targetRole = targetProfile.role || '';
    if (targetRole.includes('admin') || targetRole.includes('trainer') || targetRole.includes('platform_admin')) {
      console.error(`BLOCKED PASSWORD RESET: Attempt to reset ${targetRole} password (${targetProfile.username}) from handler interface by requester: ${requesterId}`);
      throw new Error(`Cannot reset password for ${targetRole} accounts from handler interface. Use User Admin instead.`);
    }

    // Verify the role is actually 'handler'
    if (!targetRole.includes('handler')) {
      console.error(`BLOCKED PASSWORD RESET: Target user ${authUserId} has unexpected role: ${targetRole}`);
      throw new Error('Target user is not a handler. Cannot reset password from this interface.');
    }

    // Safe to reset - target is confirmed as a handler
    const { error: resetError } = await supabase.auth.admin.updateUserById(authUserId, {
      password: password
    });

    if (resetError) {
      console.error("Password reset error:", resetError);
      throw resetError;
    }

    console.log(`Handler password reset: ${handler.first_name} ${handler.last_name} (${handler.email}) by requester: ${requesterId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Reset password error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error resetting password' }),
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
