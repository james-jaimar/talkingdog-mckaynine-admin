
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
        
        // Debug: Log the total number of profiles before any filtering
        const { count: totalProfileCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
          
        console.log(`Total profile count from database: ${totalProfileCount || 0}`);
        
        // Get all profiles from the profiles table - explicitly select all columns with no filters
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        console.log(`Found ${profiles?.length || 0} total profiles in database (RAW):`, profiles);
        
        if (!profiles || profiles.length === 0) {
          console.warn("No profiles found in the database");
          return [];
        }
        
        // Get trainers in a separate query
        const { data: trainers, error: trainersError } = await supabase
          .from('trainers')
          .select('*');
          
        if (trainersError) {
          console.error("Error fetching trainers:", trainersError);
        }
        
        const trainersList = trainers || [];
        
        // Map profiles to user profile objects
        const userProfiles: UserProfile[] = profiles.map(profile => {
          const linkedTrainer = trainersList.find(t => t.user_id === profile.id);
          const isCurrentUser = currentUser?.id === profile.id;
          
          return {
            id: profile.id,
            username: profile.username || "",
            full_name: profile.full_name || "",
            avatar_url: profile.avatar_url,
            role: profile.role || "user",
            created_at: profile.created_at,
            email: profile.username, // Email is stored in username field
            trainer: linkedTrainer || null,
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
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
  });
}
