
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trainer } from "../types/trainer";

export function useTrainersList() {
  return useQuery({
    queryKey: ['trainers-list'],
    queryFn: async () => {
      try {
        // First get all users with trainer role
        const { data: trainerProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'trainer');
        
        if (profilesError) throw profilesError;

        // Now get trainer-specific data
        const { data: trainerData, error: trainersError } = await supabase
          .from('trainers')
          .select('*');

        if (trainersError) throw trainersError;

        // Combine the data
        const combinedTrainers = trainerProfiles.map(profile => {
          // Find matching trainer data
          const trainerInfo = trainerData?.find(t => t.user_id === profile.id) || null;
          
          return {
            id: trainerInfo?.id || profile.id,
            user_id: profile.id,
            first_name: profile.full_name?.split(' ')[0] || '',
            last_name: profile.full_name?.split(' ')[1] || '',
            email: profile.username || '',
            avatar_url: profile.avatar_url,
            specialties: trainerInfo?.specialties || [],
            bio: trainerInfo?.bio || '',
            phone: trainerInfo?.phone || '',
            branch_id: trainerInfo?.branch_id || null,
            created_at: trainerInfo?.created_at || profile.created_at,
            updated_at: trainerInfo?.updated_at || profile.updated_at,
          } as Trainer;
        });

        return combinedTrainers;
      } catch (error) {
        console.error("Error fetching trainers:", error);
        throw error;
      }
    },
  });
}
