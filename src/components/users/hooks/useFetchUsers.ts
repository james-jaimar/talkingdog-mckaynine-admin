
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "../types/userTypes";

export function useFetchUsers() {
  return useQuery({
    queryKey: ['users-admin'],
    queryFn: async () => {
      try {
        console.log("Fetching ALL user profiles from profiles table");
        
        // Get current user for marking in the UI
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        console.log("Current user ID:", currentUser?.id);
        
        // Get all profiles from the profiles table - explicitly select all columns
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .limit(100); // Add a reasonable limit
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        console.log(`Found ${profiles?.length || 0} total profiles in database (RAW):`, profiles);
        
        if (!profiles || profiles.length === 0) {
          console.warn("No profiles found in the database");
          return [];
        }
        
        // Map profiles to user profile objects without trying to fetch trainer data
        const userProfiles: UserProfile[] = profiles.map(profile => {
          const isCurrentUser = currentUser?.id === profile.id;
          
          return {
            id: profile.id,
            username: profile.username || "",
            full_name: profile.full_name || "",
            avatar_url: profile.avatar_url,
            role: profile.role || "user",
            created_at: profile.created_at,
            email: profile.username, // Email is stored in username field
            isCurrentUser
          };
        });
        
        console.log("Mapped user profiles:", userProfiles);
        
        return userProfiles;
      } catch (error) {
        console.error("Error in useFetchUsers:", error);
        throw error;
      }
    },
    staleTime: 0, // Don't cache data
    gcTime: 0,    // Don't keep old data
    refetchOnWindowFocus: true,
  });
}
