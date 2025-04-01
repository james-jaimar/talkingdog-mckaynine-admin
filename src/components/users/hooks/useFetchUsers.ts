
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "../types/userTypes";

export function useFetchUsers() {
  return useQuery({
    queryKey: ['users-admin'],
    queryFn: async () => {
      try {
        console.log("Fetching all user profiles from profiles table");
        
        // First get all profiles from the profiles table with a direct query
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        console.log(`Found ${profiles?.length || 0} profiles in database`);
        
        if (!profiles || profiles.length === 0) {
          return [];
        }
        
        // Get current user for marking in the UI
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Get trainers in a separate query
        const { data: trainers, error: trainersError } = await supabase
          .from('trainers')
          .select('*');
          
        if (trainersError) {
          console.error("Error fetching trainers:", trainersError);
        }
        
        const trainersList = trainers || [];
        console.log(`Found ${trainersList.length} trainers`);
        
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
        
        // Debug log all found users
        userProfiles.forEach((user, index) => {
          console.log(`User ${index + 1}: ${user.full_name || user.username} (${user.role})`);
        });
        
        return userProfiles;
      } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
    },
    staleTime: 10 * 1000, // 10 seconds
  });
}
