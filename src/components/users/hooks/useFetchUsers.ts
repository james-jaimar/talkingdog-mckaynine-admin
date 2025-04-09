
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "../types/userTypes";

export function useFetchUsers() {
  return useQuery({
    queryKey: ['users-admin'],
    queryFn: async () => {
      try {
        // Get current user for marking in the UI
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Log current user ID for debugging
        console.log("Current user ID:", currentUser?.id);
        
        // Get all profiles from the profiles table with explicit ordering
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        // Log the retrieved profiles for debugging
        console.log(`Found ${profiles?.length || 0} profiles in database:`, profiles);
        
        if (!profiles || profiles.length === 0) {
          console.log("No profiles found in database");
          return [];
        }
        
        // Map profiles to user profile objects, marking the current user
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
    refetchOnWindowFocus: true,
  });
}
