
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "../types/userTypes";

export function useFetchUsers() {
  return useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      console.log("Fetching all users with service role");
      
      // Get current user for marking in the UI
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log("Current user ID:", currentUser?.id);
      
      try {
        // Use the more reliable from() method with explicit SELECT
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, role, created_at')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching users:", error);
          throw new Error(`Failed to fetch users: ${error.message}`);
        }
        
        console.log("Raw profiles data retrieved:", profiles?.length || 0, "records");
        console.log("First few profiles:", profiles?.slice(0, 5));
        
        if (!profiles || profiles.length === 0) {
          console.warn("No profiles were returned from database");
          return [];
        }
        
        // Map profiles to UserProfile objects with email derived from username field
        const userProfiles: UserProfile[] = profiles.map(profile => ({
          id: profile.id,
          username: profile.username || "",
          full_name: profile.full_name || "",
          avatar_url: profile.avatar_url,
          role: profile.role || "user",
          created_at: profile.created_at,
          email: profile.username || "", // Email is stored in username field
          isCurrentUser: currentUser?.id === profile.id
        }));
        
        console.log("Processed user profiles:", userProfiles.length);
        return userProfiles;
      } catch (error) {
        console.error("Error in useFetchUsers:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60, // 1 minute
  });
}
