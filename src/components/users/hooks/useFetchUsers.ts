
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "../types/userTypes";

export function useFetchUsers() {
  return useQuery({
    queryKey: ['users-admin'],
    queryFn: async () => {
      try {
        console.log("Fetching user profiles...");
        
        // Get the current user's ID for comparison
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        console.log("Current authenticated user ID:", currentUser?.id);
        
        // First get all profiles from the profiles table - no filtering
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (profilesError) {
          console.error("Error fetching user profiles:", profilesError);
          throw profilesError;
        }
        
        console.log("Fetched profiles:", profiles?.length, "profiles");
        console.log("Raw profiles data:", profiles);
        
        if (!profiles || profiles.length === 0) {
          console.log("No profiles found in the database.");
          return [];
        }
        
        // DEBUG - show a clear log of all the profiles we found
        profiles.forEach((profile, index) => {
          console.log(`Profile ${index + 1}:`, profile.id, profile.username, profile.role);
        });
        
        // Then get trainer information for users linked to trainers
        const userIds = profiles.map(profile => profile.id);
        console.log("Looking up trainers for", userIds.length, "user IDs");
        
        // Use non-empty array check to prevent query error
        let trainers = [];
        if (userIds.length > 0) {
          const { data: trainersData, error: trainersError } = await supabase
            .from('trainers')
            .select('*')
            .in('user_id', userIds);
            
          if (trainersError) {
            console.error("Error fetching trainers for users:", trainersError);
          } else {
            trainers = trainersData || [];
            console.log("Found", trainers.length, "trainers linked to users");
          }
        }
        
        // Join the data and return all profiles
        const usersWithTrainers = profiles.map(profile => {
          // Check for trainer linked to this user
          const linkedTrainer = trainers.find(t => t.user_id === profile.id) || null;
          
          const isCurrentUser = profile.id === currentUser?.id;
          
          return {
            ...profile,
            trainer: linkedTrainer,
            // Use the email address from the username field as a fallback
            email: profile.username,
            isCurrentUser
          };
        });
        
        console.log("Final user list:", usersWithTrainers.length, "users");
        
        // Log all users to ensure they're being returned
        usersWithTrainers.forEach((user, index) => {
          console.log(`User ${index + 1}:`, user.id, user.username, user.role);
        });
        
        return usersWithTrainers as UserProfile[];
      } catch (error) {
        console.error("Error in users query:", error);
        throw error;
      }
    },
    // Reduce stale time for more frequent refreshes
    staleTime: 1000 * 15 // 15 seconds
  });
}
