
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
        
        console.log("Fetched profiles:", profiles?.length, "profiles");
        console.log("Profile data:", profiles);
        
        // Get user metadata from auth API
        let usersData = null;
        let usersError = null;
        
        try {
          console.log("Fetching user metadata...");
          const result = await supabase.auth.admin.listUsers();
          usersData = result.data;
          usersError = result.error;
          
          if (usersError) {
            console.error("Error in metadata response:", usersError);
          } else {
            console.log("Fetched metadata for", usersData?.users?.length, "users");
          }
        } catch (err) {
          console.error("Exception when fetching user metadata:", err);
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
          console.log("Created metadata map with", userMetadataMap.size, "entries");
        }
        
        // Then get trainer information for users linked to trainers
        const userIds = profiles.map(profile => profile.id);
        console.log("Looking up trainers for", userIds.length, "user IDs");
        
        const { data: trainers, error: trainersError } = await supabase
          .from('trainers')
          .select('*')
          .in('user_id', userIds);
          
        if (trainersError) {
          console.error("Error fetching trainers for users:", trainersError);
          // Don't throw, just continue with profiles data
        } else {
          console.log("Found", trainers?.length, "trainers linked to users");
        }
        
        // Join the data - IMPORTANT: No filtering!
        const usersWithTrainers = profiles.map(profile => {
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
        });
        
        console.log("Final user list:", usersWithTrainers.length, "users");
        // Log the first few users for debugging
        if (usersWithTrainers.length > 0) {
          console.log("Sample users:", usersWithTrainers.slice(0, Math.min(3, usersWithTrainers.length)));
        }
        
        return usersWithTrainers as UserProfile[];
      } catch (error) {
        console.error("Error in users query:", error);
        throw error;
      }
    },
    // Reduce stale time to ensure we get fresh data more often
    staleTime: 1000 * 60 * 1 // 1 minute
  });
}
