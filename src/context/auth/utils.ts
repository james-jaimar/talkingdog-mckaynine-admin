
import { supabase } from "@/integrations/supabase/client";
import { APP_ID } from "@/constants/app";

// Fetch user roles from user_roles table (new secure approach)
export const fetchUserRoles = async (userId: string | undefined): Promise<string | null> => {
  if (!userId) return null;
  
  try {
    console.log("Fetching roles for user ID:", userId);
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (error) {
      console.error("Error fetching user roles:", error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log("No roles found for user");
      return null;
    }
    
    // Combine all roles into a comma-separated string
    const roles = data.map(r => r.role).join(',');
    console.log("Fetched user roles:", roles);
    return roles;
    
  } catch (error) {
    console.error("Error in fetchUserRoles:", error);
    return null;
  }
};

// Legacy function - kept for backwards compatibility but now wraps fetchUserRoles
export const fetchUserProfile = async (userId: string | undefined) => {
  if (!userId) return null;
  
  try {
    // First get roles from user_roles table
    const roles = await fetchUserRoles(userId);
    
    // Also get app_id from profiles for compatibility
    const { data, error } = await supabase
      .from('profiles')
      .select('app_id')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching profile app_id:", error);
    }
    
    return {
      role: roles,
      app_id: data?.app_id
    };
    
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    return null;
  }
};

export const ensureAdminRole = async (userId: string, email: string | undefined, currentRole: string | null) => {
  // Special case for platform admin
  if (email === 'james@jaimar.dev') {
    console.log("Special user detected, ensuring platform_admin role");
    
    // Check if already has platform_admin role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'platform_admin')
      .maybeSingle();
    
    if (!existingRole) {
      // Add platform_admin role
      await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'platform_admin' })
        .select();
    }
    
    // Also update profiles for app_id
    await supabase
      .from('profiles')
      .update({ app_id: APP_ID })
      .eq('id', userId);
      
    return 'platform_admin';
  }
  
  // For all other users, just ensure app_id is set on profiles
  if (currentRole) {
    console.log(`Preserving existing role: ${currentRole}`);
    
    // Ensure app_id is set on profiles
    await supabase
      .from('profiles')
      .update({ app_id: APP_ID })
      .eq('id', userId)
      .is('app_id', null);
      
    return currentRole;
  }
  
  // For users without any role, check if they need a default
  console.log("No role found, returning null");
  return null;
};

// Check handler onboarding status
export const checkHandlerOnboardingStatus = async (userId: string): Promise<'pending' | 'completed' | null> => {
  try {
    const { data, error } = await supabase
      .from('handler_onboarding')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking onboarding status:", error);
      return null;
    }
    
    return data?.status as 'pending' | 'completed' | null;
  } catch (error) {
    console.error("Error in checkHandlerOnboardingStatus:", error);
    return null;
  }
};

// New utility to check if a user has a specific role
export const userHasRole = (userRoles: string, roleToCheck: string) => {
  return userRoles.split(',').includes(roleToCheck);
};
