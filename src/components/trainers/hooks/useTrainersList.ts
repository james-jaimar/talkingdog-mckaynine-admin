
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trainer } from "../types/trainer";
import { userHasRole } from "@/context/auth/utils";

export function useTrainersList() {
  return useQuery({
    queryKey: ['trainers-list'],
    queryFn: async () => {
      try {
        console.log("Fetching trainers from profiles table");
        
        // Fetch users with trainer role
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
        
        if (profilesError) throw profilesError;

        // Filter profiles to only include those with trainer role
        // This handles comma-separated roles like "admin,trainer"
        const trainersProfiles = profiles.filter(profile => 
          profile.role && profile.role.split(',').includes('trainer')
        );
        
        console.log("Found trainers profiles:", trainersProfiles.length);

        // Transform the data to match our Trainer interface
        const formattedTrainers: Trainer[] = trainersProfiles.map(profile => {
          const nameParts = profile.full_name?.split(' ') || ['', ''];
          
          return {
            id: profile.id,
            user_id: profile.id,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            email: profile.username || '',
            avatar_url: profile.avatar_url,
            phone: null,
            specialties: [],
            bio: null,
            branch_id: null,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          };
        });

        console.log("Formatted trainers:", formattedTrainers);
        return formattedTrainers;
      } catch (error) {
        console.error("Error fetching trainers:", error);
        throw error;
      }
    },
  });
}
