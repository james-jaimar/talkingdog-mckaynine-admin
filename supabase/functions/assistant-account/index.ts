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
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'platform_admin');

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only admins can manage assistant accounts' }),
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
  const { assistantId, email, password } = data;
  
  if (!assistantId || !email || !password) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get assistant info
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('id, first_name, last_name, email, user_id, branch_id')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      throw new Error('Assistant not found');
    }

    if (assistant.user_id) {
      throw new Error('Assistant already has a login account');
    }

    // Check if email already exists in auth
    const { data: existingUserData } = await supabase.auth.admin.getUserByEmail(email);
    
    let authUserId: string;
    let isExistingAccount = false;

    if (existingUserData?.user) {
      // User already exists - check if safe to link
      const existingUserId = existingUserData.user.id;
      
      // SECURITY: Check if existing user has admin/trainer roles
      const { data: existingRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', existingUserId);

      const hasAdminRole = existingRoles?.some(r => 
        r.role === 'admin' || r.role === 'trainer' || r.role === 'platform_admin'
      );

      if (hasAdminRole) {
        console.error(`BLOCKED: Attempt to link admin/trainer account to assistant: ${email} by requester: ${requesterId}`);
        throw new Error('This email is associated with an admin or trainer account and cannot be linked');
      }

      // Check if this auth user is already linked to another assistant
      const { data: linkedAssistant } = await supabase
        .from('assistants')
        .select('id, first_name, last_name')
        .eq('user_id', existingUserId)
        .single();

      if (linkedAssistant && linkedAssistant.id !== assistantId) {
        throw new Error(`This account is already linked to assistant: ${linkedAssistant.first_name} ${linkedAssistant.last_name || ''}`);
      }

      // Safe to link existing account
      authUserId = existingUserId;
      isExistingAccount = true;
      
      // Update password for the existing user
      const { error: passwordError } = await supabase.auth.admin.updateUserById(authUserId, {
        password: password
      });

      if (passwordError) {
        console.error('Password update error:', passwordError);
        throw new Error('Failed to set password for existing account');
      }

      console.log(`Linked existing account to assistant: ${assistant.first_name} ${assistant.last_name || ''} (${email}) by requester: ${requesterId}`);
    } else {
      // Create new auth user
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
          full_name: `${assistant.first_name} ${assistant.last_name || ''}`.trim(),
          signup_intent: 'assistant'
        }
      });

      if (createError) throw createError;
      if (!userData.user) throw new Error('User creation failed');

      authUserId = userData.user.id;
      console.log(`Assistant account created: ${assistant.first_name} ${assistant.last_name || ''} (${email}) by requester: ${requesterId}`);
    }

    // Update profile with assistant role
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ 
        id: authUserId,
        role: 'assistant',
        full_name: `${assistant.first_name} ${assistant.last_name || ''}`.trim(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    // Link auth user to assistant
    const { error: linkError } = await supabase
      .from('assistants')
      .update({ user_id: authUserId })
      .eq('id', assistantId);

    if (linkError) {
      // Rollback: delete the auth user only if we created it
      if (!isExistingAccount) {
        await supabase.auth.admin.deleteUser(authUserId);
      }
      throw linkError;
    }

    // Add assistant role to user_roles table
    await supabase
      .from('user_roles')
      .upsert({
        user_id: authUserId,
        role: 'assistant'
      }, { onConflict: 'user_id,role' });

    return new Response(
      JSON.stringify({ success: true, authUserId, linked: isExistingAccount }),
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
  const { assistantId, password } = data;
  
  if (!assistantId || !password) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields (assistantId, password)' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get assistant with user_id
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('id, first_name, last_name, email, user_id')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      throw new Error('Assistant not found');
    }

    if (!assistant.user_id) {
      throw new Error('Assistant does not have a login account');
    }

    const authUserId = assistant.user_id;

    // CRITICAL SECURITY CHECK: Verify target user is an assistant, NOT admin/trainer
    const { data: targetRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUserId);

    const hasAdminRole = targetRoles?.some(r => 
      r.role === 'admin' || r.role === 'trainer' || r.role === 'platform_admin'
    );

    if (hasAdminRole) {
      console.error(`BLOCKED PASSWORD RESET: Attempt to reset admin/trainer password from assistant interface by requester: ${requesterId}`);
      throw new Error('Cannot reset password for admin/trainer accounts from assistant interface');
    }

    // Safe to reset - target is confirmed as an assistant
    const { error: resetError } = await supabase.auth.admin.updateUserById(authUserId, {
      password: password
    });

    if (resetError) {
      console.error("Password reset error:", resetError);
      throw resetError;
    }

    console.log(`Assistant password reset: ${assistant.first_name} ${assistant.last_name || ''} (${assistant.email}) by requester: ${requesterId}`);

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
  const { assistantId } = data;
  
  if (!assistantId) {
    return new Response(
      JSON.stringify({ error: 'Missing assistantId' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get assistant with user_id
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('user_id')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      throw new Error('Assistant not found');
    }

    if (!assistant.user_id) {
      throw new Error('Assistant does not have a login account');
    }

    const authUserId = assistant.user_id;

    // Unlink auth user from assistant
    const { error: unlinkError } = await supabase
      .from('assistants')
      .update({ user_id: null })
      .eq('id', assistantId);

    if (unlinkError) throw unlinkError;

    // Remove user_roles record
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', authUserId)
      .eq('role', 'assistant');

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
