
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, SupabaseUser, SupabaseUsersResponse } from "../types/userTypes";

export function useFetchUsers() {
  return useQuery({
    queryKey: ['users-admin'],
    queryFn: async () => {
      try {
        console.log("Fetching user profiles...");
        // First get all profiles from the profiles table
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (profilesError) {
          console.error("Error fetching user profiles:", profilesError);
          throw profilesError;
        }
        
        console.log("Fetched profiles:", profiles?.length, "profiles");
        console.log("Profile data sample:", profiles?.slice(0, 2));
        
        // Try to get user metadata from auth API
        let usersData = null;
        let usersError = null;
        
        try {
          console.log("Attempting to fetch user metadata...");
          // Use admin.listUsers() - this requires service_role key
          const result = await supabase.auth.admin.listUsers();
          usersData = result.data;
          usersError = result.error;
          
          if (usersError) {
            console.error("Error in metadata response:", usersError);
            console.log("This is likely a permissions issue. The app might be using the anon key instead of service_role key.");
            // Continue anyway with just profiles data
          } else {
            console.log("Fetched metadata for", usersData?.users?.length, "users");
          }
        } catch (err) {
          console.error("Exception when fetching user metadata:", err);
          console.log("Will continue with just profiles data - users will still show up but might be missing some metadata");
        }
        
        // Create a map of user metadata if we have it
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
          // Continue with profiles data only
        } else {
          console.log("Found", trainers?.length, "trainers linked to users");
        }
        
        // Join the data - IMPORTANT: No filtering, show ALL users from profiles table
        const usersWithTrainers = profiles.map(profile => {
          // Check for trainer linked to this user
          const linkedTrainer = trainers?.find(t => {
            if (typeof t.user_id !== 'string') return false;
            return t.user_id === profile.id;
          }) || null;
          
          // Get user metadata if available
          const metadata = userMetadataMap.get(profile.id);
          
          return {
            ...profile,
            trainer: linkedTrainer,
            app_id: metadata?.app_id
          };
        });
        
        console.log("Final user list:", usersWithTrainers.length, "users");
        if (usersWithTrainers.length > 0) {
          console.log("Sample users:", usersWithTrainers.slice(0, Math.min(3, usersWithTrainers.length)));
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
