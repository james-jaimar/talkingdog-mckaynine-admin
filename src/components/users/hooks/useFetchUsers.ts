
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "../types/userTypes";

export function useFetchUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      console.log("Starting useFetchUsers operation");
      
      try {
        // Get current user for marking in the UI
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        console.log("Current auth user:", currentUser?.id);
        
        // Direct select from profiles with minimal query to debug
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching profiles:", error);
          throw error;
        }
        
        console.log("Raw profiles data retrieved:", profiles?.length || 0, "records");
        
        if (!profiles || profiles.length === 0) {
          console.warn("No profiles were returned from database");
          return [];
        }
        
        // Log the first few profiles to debug
        profiles.slice(0, 5).forEach((profile, index) => {
          console.log(`Profile ${index}:`, { 
            id: profile.id, 
            username: profile.username,
            role: profile.role
          });
        });
        
        // Map to UserProfile objects
        const userProfiles: UserProfile[] = profiles.map(profile => ({
          id: profile.id,
          username: profile.username || "",
          full_name: profile.full_name || "",
          avatar_url: profile.avatar_url,
          role: profile.role || "user",
          created_at: profile.created_at,
          email: profile.username, // Email is stored in username field
          isCurrentUser: currentUser?.id === profile.id
        }));
        
        console.log("Final processed user profiles:", userProfiles.length);
        return userProfiles;
      } catch (error) {
        console.error("Error in useFetchUsers:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60, // 1 minute
  });
}
