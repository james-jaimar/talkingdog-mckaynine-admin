
import { supabase } from "@/integrations/supabase/client";
import { APP_ID } from "@/constants/app";

// Fetch the user profile from Supabase
export const fetchUserProfile = async (userId: string | undefined) => {
  if (!userId) return null;
  
  try {
    console.log("Fetching profile for user ID:", userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('role, app_id')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
    
    console.log("Fetched user profile data:", data);
    return data;
    
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    return null;
  }
};

export const ensureAdminRole = async (userId: string, email: string | undefined, currentRole: string | null) => {
  // Only preserve roles and ensure app_id is set, but don't override manually set roles
  
  // Most important: If the user has a handler role, preserve it
  if (currentRole === 'handler') {
    console.log("User has handler role, preserving it");
    
    // Ensure app_id is set
    await supabase
      .from('profiles')
      .update({ app_id: APP_ID })
      .eq('id', userId);
      
    return 'handler';
  }
  
  // For all other users, just ensure app_id is set but don't change roles
  if (currentRole) {
    console.log(`Preserving existing role: ${currentRole}`);
    
    // Ensure app_id is set
    await supabase
      .from('profiles')
      .update({ app_id: APP_ID })
      .eq('id', userId)
      .is('app_id', null); // Only update if app_id is null
      
    return currentRole;
  }
  
  // For new users without a role, set a default role
  console.log("Setting default role for new user");
  const { error } = await supabase
    .from('profiles')
    .update({ 
      role: 'user',
      app_id: APP_ID 
    })
    .eq('id', userId);
  
  if (error) {
    console.error("Error updating default role:", error);
    return currentRole || 'user';
  }
  
  return 'user';
};

// New utility to check if a user has a specific role
export const userHasRole = (userRoles: string, roleToCheck: string) => {
  return userRoles.split(',').includes(roleToCheck);
};
