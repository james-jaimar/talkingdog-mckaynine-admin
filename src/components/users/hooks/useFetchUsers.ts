
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "../types/userTypes";

export function useFetchUsers() {
  return useQuery({
    queryKey: ['users-admin'],
    queryFn: async () => {
      try {
        console.log("Starting user fetch operation");
        
        // Get current user for marking in the UI
        const { data: { user: currentUser } } = await supabase.auth.getUser();
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
        
        // For debugging: Log all fetched profiles
        console.log(`Fetched ${profiles?.length || 0} profiles from database:`, profiles);
        
        if (!profiles || profiles.length === 0) {
          console.log("No profiles found in database");
          return [];
        }
        
        // Map profiles to user profile objects, marking the current user
        const userProfiles: UserProfile[] = profiles.map(profile => {
          const isCurrentUser = currentUser?.id === profile.id;
          console.log(`Processing profile: ${profile.id}, email: ${profile.username}, role: ${profile.role}, isCurrentUser: ${isCurrentUser}`);
          
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
        
        console.log(`Successfully processed ${userProfiles.length} user profiles`);
        console.table(userProfiles); // Log as table for better visibility
        
        return userProfiles;
      } catch (error) {
        console.error("Error in useFetchUsers:", error);
        throw error;
      }
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
