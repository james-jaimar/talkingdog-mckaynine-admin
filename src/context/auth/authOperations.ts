
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
    console.log("Performing complete logout with session cleanup");
    
    // Clear local storage first to ensure immediate UI feedback
    localStorage.removeItem('supabase.auth.token');
    
    // Also clear any other auth-related items that might be in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('supabase.auth')) {
        localStorage.removeItem(key);
      }
    }
    
    // Force session expiry on the server side
    const { error } = await supabase.auth.signOut({
      scope: 'global' // Sign out from all tabs/windows
    });
    
    if (error) {
      console.error("Error during signout API call:", error);
      // Even if there's an API error, continue with client-side cleanup
    }
    
    // Add some delay to ensure the signOut operation completes
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Verify the session is gone
    const { data } = await supabase.auth.getSession();
    console.log("Session after logout:", data.session ? "Still present" : "Successfully cleared");
    
    return { success: true, error: null };
  } catch (error) {
    console.error("Logout error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};
