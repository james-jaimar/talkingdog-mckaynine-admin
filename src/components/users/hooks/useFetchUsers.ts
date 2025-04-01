
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, SupabaseUser, SupabaseUsersResponse } from "../types/userTypes";

export function useFetchUsers() {
  return useQuery({
    queryKey: ['users-admin'],
    queryFn: async () => {
      try {
        console.log("Fetching user profiles...");
        // First get all profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (profilesError) {
          console.error("Error fetching user profiles:", profilesError);
          throw profilesError;
        }
        
        console.log("Fetched profiles:", profiles);
        
        // Get user metadata from auth API
        let usersData = null;
        let usersError = null;
        
        try {
          const result = await supabase.auth.admin.listUsers();
          usersData = result.data;
          usersError = result.error;
        } catch (err) {
          console.error("Error fetching user metadata:", err);
          // Continue with profiles data even if metadata fetch fails
        }
        
        // Create a map of user metadata
        const userMetadataMap = new Map<string, { app_id?: string; raw_metadata: any }>();
        if (usersData && usersData.users) {
          const supabaseUsers = usersData.users as SupabaseUser[];
          supabaseUsers.forEach((user) => {
            userMetadataMap.set(user.id, {
              app_id: user.user_metadata?.app_id,
              raw_metadata: user.user_metadata
            });
          });
        }
        
        console.log("User metadata map:", userMetadataMap);
        
        // Then get trainer information for users linked to trainers
        const userIds = profiles.map(profile => profile.id);
        
        const { data: trainers, error: trainersError } = await supabase
          .from('trainers')
          .select('*')
          .in('user_id', userIds);
          
        if (trainersError) {
          console.error("Error fetching trainers for users:", trainersError);
          // Don't throw, just continue with profiles data
        }
        
        // Join the data 
        const appId = "mckaynine-training-centre";
        const usersWithTrainers = profiles
          .map(profile => {
            // Check for trainer linked to this user
            const linkedTrainer = trainers?.find(t => {
              if (typeof t.user_id !== 'string') return false;
              return t.user_id === profile.id;
            }) || null;
            
            // Get user metadata
            const metadata = userMetadataMap.get(profile.id);
            
            return {
              ...profile,
              trainer: linkedTrainer,
              app_id: metadata?.app_id
            };
          })
          .filter(user => {
            // Include all users from profile table in admin view
            // This is the key change - we're not filtering based on app_id anymore
            // which was causing some users to be filtered out incorrectly
            return true;
          });
        
        console.log("All users with trainers:", usersWithTrainers);
        
        return usersWithTrainers as UserProfile[];
      } catch (error) {
        console.error("Error in users query:", error);
        throw error;
      }
    }
  });
}
