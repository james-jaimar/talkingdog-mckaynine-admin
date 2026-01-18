import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

// Generate secure random password
function generateSecurePassword(length = 12): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
  let password = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

interface ProcessResult {
  handlerId: string;
  email: string;
  name: string;
  success: boolean;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

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
        JSON.stringify({ error: 'Only admins can run bulk account creation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData = await req.json();
    const { operation, branchId, dryRun = false } = requestData;

    if (operation === 'create_all_accounts') {
      return await handleCreateAllAccounts(supabaseAdmin, user.id, branchId, dryRun);
    } else {
      return new Response(
        JSON.stringify({ error: 'Unknown operation. Use: create_all_accounts' }),
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

async function handleCreateAllAccounts(
  supabase: any, 
  requesterId: string, 
  branchId?: string,
  dryRun: boolean = false
) {
  console.log(`Bulk account creation started by ${requesterId}, dryRun: ${dryRun}, branchId: ${branchId || 'all'}`);
  
  const results: ProcessResult[] = [];
  let created = 0;
  let skipped = 0;
  let failed = 0;

  try {
    // Get all handlers without accounts
    // If branchId is specified, filter via client_branches junction table
    let handlerIds: string[] = [];
    
    if (branchId) {
      const { data: clientBranches, error: cbError } = await supabase
        .from('client_branches')
        .select('client_id')
        .eq('branch_id', branchId);
      
      if (cbError) {
        throw new Error(`Failed to fetch client branches: ${cbError.message}`);
      }
      handlerIds = clientBranches?.map(cb => cb.client_id) || [];
      
      if (handlerIds.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "No handlers found in this branch",
            results: [],
            summary: { created: 0, skipped: 0, failed: 0 }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    let query = supabase
      .from('clients')
      .select('id, first_name, last_name, email, branch_id, auth_user_id')
      .is('auth_user_id', null)
      .not('email', 'is', null)
      .order('first_name');

    if (branchId && handlerIds.length > 0) {
      query = query.in('id', handlerIds);
    }

    const { data: handlers, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch handlers: ${fetchError.message}`);
    }

    console.log(`Found ${handlers?.length || 0} handlers without accounts`);

    if (dryRun) {
      // Just return what would be processed
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          totalToProcess: handlers?.length || 0,
          handlers: handlers?.map((h: any) => ({
            id: h.id,
            name: `${h.first_name} ${h.last_name}`,
            email: h.email,
          })) || [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get list of admin/trainer emails to skip
    const { data: adminTrainerProfiles } = await supabase
      .from('profiles')
      .select('username, role')
      .or('role.ilike.%admin%,role.ilike.%trainer%,role.ilike.%platform_admin%');

    const blockedEmails = new Set(
      (adminTrainerProfiles || []).map((p: any) => p.username?.toLowerCase()).filter(Boolean)
    );

    // Process each handler
    for (const handler of handlers || []) {
      const email = handler.email?.toLowerCase().trim();
      const fullName = `${handler.first_name} ${handler.last_name}`.trim();

      // Skip if no email
      if (!email) {
        results.push({
          handlerId: handler.id,
          email: '',
          name: fullName,
          success: false,
          skipped: true,
          skipReason: 'No email address',
        });
        skipped++;
        continue;
      }

      // Skip if email belongs to admin/trainer
      if (blockedEmails.has(email)) {
        results.push({
          handlerId: handler.id,
          email,
          name: fullName,
          success: false,
          skipped: true,
          skipReason: 'Email belongs to admin/trainer',
        });
        skipped++;
        continue;
      }

      // Check if auth user already exists with this email
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u: any) => u.email?.toLowerCase() === email
      );

      if (existingUser) {
        results.push({
          handlerId: handler.id,
          email,
          name: fullName,
          success: false,
          skipped: true,
          skipReason: 'Auth user already exists with this email',
        });
        skipped++;
        continue;
      }

      // Generate password and create account
      const password = generateSecurePassword();

      try {
        // Create auth user
        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { 
            full_name: fullName,
            signup_intent: 'handler'
          }
        });

        if (createError) {
          throw createError;
        }

        if (!userData.user) {
          throw new Error('User creation failed - no user returned');
        }

        const authUserId = userData.user.id;

        // Update profile with handler role
        await supabase
          .from('profiles')
          .update({ 
            role: 'handler',
            full_name: fullName,
            updated_at: new Date().toISOString()
          })
          .eq('id', authUserId);

        // Link auth user to handler
        const { error: linkError } = await supabase
          .from('clients')
          .update({ 
            auth_user_id: authUserId,
            onboarding_status: 'completed'
          })
          .eq('id', handler.id);

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
            client_id: handler.id,
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

        results.push({
          handlerId: handler.id,
          email,
          name: fullName,
          success: true,
        });
        created++;

        console.log(`Created account for ${fullName} (${email})`);

      } catch (error: any) {
        results.push({
          handlerId: handler.id,
          email,
          name: fullName,
          success: false,
          error: error.message || 'Unknown error',
        });
        failed++;

        console.error(`Failed to create account for ${fullName} (${email}):`, error.message);
      }
    }

    console.log(`Bulk account creation complete: ${created} created, ${skipped} skipped, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: handlers?.length || 0,
          created,
          skipped,
          failed,
        },
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Bulk account creation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error processing handlers',
        partialResults: results,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
