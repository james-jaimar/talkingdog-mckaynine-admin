
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
        // IMPORTANT: Modified from to use * instead of ids so we get all columns
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (profilesError) {
          console.error("Error fetching user profiles:", profilesError);
          throw profilesError;
        }
        
        console.log("Fetched profiles:", profiles?.length, "profiles");
        console.log("All profile records:", profiles);
        
        if (profiles && profiles.length === 0) {
          console.log("No profiles found in the database. This is likely because no users have registered yet.");
        }
        
        // DEBUG - show a clear log of all the profiles we found
        if (profiles) {
          profiles.forEach((profile, index) => {
            console.log(`Profile ${index + 1}:`, profile.id, profile.username, profile.role);
          });
        }
        
        // Then get trainer information for users linked to trainers
        const userIds = profiles?.map(profile => profile.id) || [];
        console.log("Looking up trainers for", userIds.length, "user IDs");
        
        const { data: trainers, error: trainersError } = await supabase
          .from('trainers')
          .select('*')
          .in('user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']); // Prevent empty array error
          
        if (trainersError) {
          console.error("Error fetching trainers for users:", trainersError);
          // Continue with profiles data only
        } else {
          console.log("Found", trainers?.length, "trainers linked to users");
        }
        
        // Join the data and return all profiles
        const usersWithTrainers = profiles?.map(profile => {
          // Check for trainer linked to this user
          const linkedTrainer = trainers?.find(t => {
            if (typeof t.user_id !== 'string') return false;
            return t.user_id === profile.id;
          }) || null;
          
          const isCurrentUser = profile.id === currentUser?.id;
          if (isCurrentUser) {
            console.log("Current user found in profiles:", profile);
          }
          
          return {
            ...profile,
            trainer: linkedTrainer,
            // Use the email address from the username field as a fallback
            email: profile.username,
            isCurrentUser
          };
        }) || [];
        
        console.log("Final user list:", usersWithTrainers.length, "users");
        console.log("All user records:", usersWithTrainers);
        
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
