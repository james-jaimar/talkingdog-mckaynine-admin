
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
 * For handler signups, include signup_intent: 'handler' in metadata
 */
export const signupWithEmailAndPassword = async (email: string, password: string, metadata?: any) => {
  try {
    // If role is handler, add signup_intent for the database trigger
    const enhancedMetadata = {
      ...metadata,
      signup_intent: metadata?.role === 'handler' ? 'handler' : undefined
    };
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: enhancedMetadata
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
    // Collect keys first, then remove (avoids skipping during iteration)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('supabase.auth')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    
    if (error) {
      console.error("Error during signout API call:", error);
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error("Logout error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};
