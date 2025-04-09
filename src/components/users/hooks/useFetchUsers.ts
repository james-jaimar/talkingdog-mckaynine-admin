
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
        
        console.log("Current user ID:", currentUser?.id);
        
        // Get all profiles from the profiles table with explicit ordering
        // IMPORTANT: Using * to ensure we get all fields
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        // Log the raw profiles data for debugging
        console.log("Raw profiles data from database:", profiles);
        console.log(`Found ${profiles?.length || 0} profiles in database`);
        
        if (!profiles || profiles.length === 0) {
          console.log("No profiles found in database");
          return [];
        }
        
        // Map profiles to user profile objects, marking the current user
        const userProfiles: UserProfile[] = profiles.map(profile => {
          const isCurrentUser = currentUser?.id === profile.id;
          
          console.log(`Processing profile ${profile.id}, username: ${profile.username}, isCurrentUser: ${isCurrentUser}`);
          
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
        
        console.log("Processed and mapped user profiles:", userProfiles);
        console.log(`Total user profiles after mapping: ${userProfiles.length}`);
        
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
