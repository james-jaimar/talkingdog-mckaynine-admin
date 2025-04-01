
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
        
        // Debug: Check if we can get direct count of profiles
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
          
        console.log("Total profile count from database:", count);
        if (countError) {
          console.error("Error counting profiles:", countError);
        }
        
        // Use a fresh connection and query all profiles without any filtering or limitations
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        // Extensive debugging for the raw response
        console.log(`Found ${profiles?.length || 0} total profiles in database (RAW):`, profiles);
        console.log("Raw profile data (JSON):", JSON.stringify(profiles));
        
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
        
        // Map ALL profiles to user profile objects
        const userProfiles: UserProfile[] = profiles.map(profile => {
          const linkedTrainer = trainersList.find(t => t.user_id === profile.id);
          const isCurrentUser = currentUser?.id === profile.id;
          
          // Debug each profile as we process it
          console.log(`Processing profile: ${profile.id}, username: ${profile.username}, role: ${profile.role}`);
          
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
        
        // Debug log all found users with full details
        console.log("ALL user profiles after mapping:");
        console.log(JSON.stringify(userProfiles, null, 2));
        
        // Return the complete, unfiltered list of profiles
        return userProfiles;
      } catch (error) {
        console.error("Error in useFetchUsers:", error);
        throw error;
      }
    },
    staleTime: 0, // No stale time, always fetch fresh data
    gcTime: 0, // Don't keep old data in cache
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });
}
