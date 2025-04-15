
import { supabase } from '@/integrations/supabase/client';

/**
 * Login with email and password
 */
export const loginWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Login error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};

/**
 * Sign up with email and password
 */
export const signupWithEmailAndPassword = async (email: string, password: string, metadata?: any) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error("Signup error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};

/**
 * Logout the current user with thorough cleanup
 */
export const logout = async () => {
  try {
    console.log("Attempting to sign out user...");
    
    // First check if there's a valid session to avoid the error
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.log("No active session found, already logged out");
      return { success: true, error: null };
    }
    
    // Attempt to sign out - this should invalidate the token server-side
    const { error } = await supabase.auth.signOut({
      scope: 'global' // Ensure we sign out from all tabs/windows
    });
    
    if (error) throw error;
    
    // Clear any session data from local storage as a failsafe
    localStorage.removeItem('supabase.auth.token');
    
    // Add some delay to ensure the signOut operation completes fully
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log("Sign out completed successfully");
    return { success: true, error: null };
  } catch (error) {
    console.error("Logout error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};
