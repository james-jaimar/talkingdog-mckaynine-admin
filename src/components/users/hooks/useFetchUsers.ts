
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "../types/userTypes";

export function useFetchUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      console.log("Fetching users from profiles table");
      
      try {
        // Get current user for marking in the UI
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        console.log("Current user ID:", currentUser?.id);
        
        // Get all users from the profiles table
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching profiles:", error);
          throw error;
        }
        
        console.log("Raw profiles data:", profiles);
        console.log(`Successfully fetched ${profiles?.length || 0} user profiles`);
        
        // Map to UserProfile objects
        const userProfiles: UserProfile[] = (profiles || []).map(profile => {
          const result = {
            id: profile.id,
            username: profile.username || "",
            full_name: profile.full_name || "",
            avatar_url: profile.avatar_url,
            role: profile.role || "user",
            created_at: profile.created_at,
            email: profile.username, // Email is stored in username field
            isCurrentUser: currentUser?.id === profile.id
          };
          
          return result;
        });
        
        console.log("Processed user profiles:", userProfiles);
        console.log(`Total processed profiles: ${userProfiles.length}`);
        
        return userProfiles;
      } catch (error) {
        console.error("Error in useFetchUsers:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60, // 1 minute
  });
}
