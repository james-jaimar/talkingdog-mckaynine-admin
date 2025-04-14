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
  // Special handling for Ady Hawkins - combine roles if needed
  if (email === "ady@talkingdog.co.za") {
    console.log("Special role management for branch owner/trainer");
    
    // Ensure both admin and trainer roles are set
    const { error } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin,trainer', // Use comma-separated roles
        app_id: APP_ID 
      })
      .eq('id', userId);
    
    if (error) {
      console.error("Error updating Ady's roles:", error);
      return currentRole;
    }
    
    return 'admin'; // Default to admin for routing purposes
  }
  
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
  
  // Special case for ady@talkingdog.co.za
  if (email === "ady@talkingdog.co.za" && currentRole !== "admin") {
    console.log("This is the admin user, ensuring admin role");
    
    // Update role to admin for this special user
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        app_id: APP_ID // Set app_id for this application
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error("Error updating admin role:", updateError);
      return currentRole;
    } else {
      console.log("Successfully set ady@talkingdog.co.za as admin");
      return 'admin';
    }
  }
  
  // For all other cases, ensure app_id is set
  await supabase
    .from('profiles')
    .update({ app_id: APP_ID })
    .eq('id', userId);
  
  // Return the current role
  return currentRole;
};

// New utility to check if a user has a specific role
export const userHasRole = (userRoles: string, roleToCheck: string) => {
  return userRoles.split(',').includes(roleToCheck);
};
