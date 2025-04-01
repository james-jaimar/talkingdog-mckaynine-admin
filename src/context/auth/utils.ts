
import { supabase } from "@/integrations/supabase/client";

// Fetch the user profile from Supabase
export const fetchUserProfile = async (userId: string | undefined) => {
  if (!userId) return null;
  
  try {
    console.log("Fetching profile for user ID:", userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
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

// Handle special admin user
export const ensureAdminRole = async (userId: string, email: string | undefined, currentRole: string | null) => {
  // Special case for ady@talkingdog.co.za
  if (email === "ady@talkingdog.co.za" && currentRole !== "admin") {
    console.log("This is the admin user, ensuring admin role");
    
    // Update role to admin for this special user
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId);
    
    if (updateError) {
      console.error("Error updating admin role:", updateError);
      return null;
    } else {
      console.log("Successfully set ady@talkingdog.co.za as admin");
      return 'admin';
    }
  }
  
  return currentRole;
};
