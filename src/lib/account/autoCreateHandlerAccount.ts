import { supabase } from "@/integrations/supabase/client";

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

interface AutoCreateAccountResult {
  success: boolean;
  authUserId?: string;
  password?: string;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

/**
 * Automatically creates a handler login account for a given handler ID.
 * This is called after creating a new handler to set up their portal access.
 * 
 * The welcome email is controlled by the branch's `send_welcome_email` setting.
 * If disabled (default), accounts are created but no email is sent.
 * 
 * @param handlerId - The ID of the handler (client) to create an account for
 * @param email - The handler's email address
 * @param branchId - The branch ID for checking email settings
 * @returns Result object with success status and any errors
 */
export async function autoCreateHandlerAccount(
  handlerId: string,
  email: string,
  branchId: string
): Promise<AutoCreateAccountResult> {
  try {
    // Get current session for auth
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log("No session, skipping auto account creation");
      return { success: false, skipped: true, skipReason: "No authenticated session" };
    }

    // Generate a random password
    const password = generateSecurePassword();

    // Create the account via edge function
    const { data, error } = await supabase.functions.invoke('handler-account', {
      method: 'POST',
      body: {
        operation: 'create_account',
        handlerId,
        email,
        password,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error("Auto account creation failed:", error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      console.error("Auto account creation failed:", data?.error);
      return { success: false, error: data?.error || 'Account creation failed' };
    }

    console.log(`Auto-created handler account for ${email}`);

    // Check if welcome emails are enabled for this branch
    const { data: notifications } = await supabase
      .from('branch_notifications')
      .select('send_welcome_email')
      .eq('branch_id', branchId)
      .single();

    const sendWelcomeEmail = notifications?.send_welcome_email ?? false;

    if (sendWelcomeEmail) {
      // Queue welcome email with credentials
      // TODO: Implement welcome email queuing when ready
      console.log(`Welcome email enabled for branch, would send to ${email}`);
    } else {
      console.log(`Welcome emails disabled for branch, skipping email for ${email}`);
    }

    return {
      success: true,
      authUserId: data.authUserId,
      password, // Return password so admin can share if needed
    };

  } catch (error: any) {
    console.error("Error in autoCreateHandlerAccount:", error);
    return { success: false, error: error.message };
  }
}
