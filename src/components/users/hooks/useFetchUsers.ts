
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "../types/userTypes";

export function useFetchUsers() {
  return useQuery({
    queryKey: ['users-admin'],
    queryFn: async () => {
      try {
        console.log("Fetching user profiles...");
        
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
        if (profiles && profiles.length > 0) {
          console.log("Profile data sample:", profiles);
        } else {
          console.log("No profiles found in the database");
        }
        
        // Check if the profiles table has appropriate data
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        console.log("Total profiles in database (count):", count);
        
        if (countError) {
          console.error("Error counting profiles:", countError);
        }
        
        // Since we can't access admin APIs with the anon key,
        // we'll rely on the profiles table data, which is the primary
        // source of user information in our application
        
        // Then get trainer information for users linked to trainers
        const userIds = profiles.map(profile => profile.id);
        console.log("Looking up trainers for", userIds.length, "user IDs");
        
        const { data: trainers, error: trainersError } = await supabase
          .from('trainers')
          .select('*')
          .in('user_id', userIds);
          
        if (trainersError) {
          console.error("Error fetching trainers for users:", trainersError);
          // Continue with profiles data only
        } else {
          console.log("Found", trainers?.length, "trainers linked to users");
        }
        
        // Join the data and return all profiles
        const usersWithTrainers = profiles.map(profile => {
          // Check for trainer linked to this user
          const linkedTrainer = trainers?.find(t => {
            if (typeof t.user_id !== 'string') return false;
            return t.user_id === profile.id;
          }) || null;
          
          return {
            ...profile,
            trainer: linkedTrainer,
            // Use the email address from the username field as a fallback
            email: profile.username
          };
        });
        
        console.log("Final user list:", usersWithTrainers.length, "users");
        if (usersWithTrainers.length > 0) {
          console.log("Sample users:", usersWithTrainers);
        } else {
          console.log("WARNING: No users found in the profiles table!");
        }
        
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
