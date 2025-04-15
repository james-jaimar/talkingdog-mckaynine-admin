
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trainer } from "../types/trainer";

export function useTrainersList() {
  return useQuery({
    queryKey: ['trainers-list'],
    queryFn: async () => {
      try {
        console.log("Fetching trainers from both profiles and trainers tables");
        
        // STEP 1: Get trainers from profiles table (users with trainer role)
        const { data: trainersProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .or('role.eq.trainer,role.ilike.%trainer%');
        
        if (profilesError) {
          console.error("Error fetching trainers from profiles:", profilesError);
          throw profilesError;
        }
        
        // STEP 2: Get trainers from trainers table
        const { data: trainersTable, error: trainersError } = await supabase
          .from('trainers')
          .select('*');
        
        if (trainersError) {
          console.error("Error fetching trainers from trainers table:", trainersError);
          throw trainersError;
        }
        
        console.log("Found potential trainers from profiles:", trainersProfiles?.length);
        console.log("Found trainers from trainers table:", trainersTable?.length);
        
        // Filter to ensure we only get profiles that actually contain 'trainer' as a role
        const filteredProfileTrainers = trainersProfiles?.filter(profile => {
          if (!profile.role) return false;
          
          // Check if 'trainer' exists as a standalone role or as part of a comma-separated list
          const roles = profile.role.split(',').map(r => r.trim().toLowerCase());
          return roles.some(r => r === 'trainer' || r.includes('trainer'));
        }) || [];
        
        console.log("Filtered trainers from profiles:", filteredProfileTrainers.length);
        console.log("Filtered trainer roles:", filteredProfileTrainers.map(t => t.role));

        // Transform profile trainers to match our Trainer interface
        const profileTrainers: Trainer[] = filteredProfileTrainers.map(profile => {
          // Properly handle multi-part names
          const nameParts = profile.full_name?.split(' ') || ['', ''];
          const firstName = nameParts[0] || '';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
          
          return {
            id: profile.id,
            user_id: profile.id,
            first_name: firstName,
            last_name: lastName,
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

        // Combine both sources of trainers using a Map to deduplicate
        const trainersMap = new Map<string, Trainer>();
        
        // Add trainers from the profiles table
        profileTrainers.forEach(trainer => {
          if (trainer.user_id) {
            trainersMap.set(trainer.user_id, trainer);
          }
        });
        
        // Add/override with trainers from the trainers table which should have more complete data
        trainersTable?.forEach(trainer => {
          // If this trainer already exists in the map (from profiles), merge the data
          if (trainer.user_id && trainersMap.has(trainer.user_id)) {
            const existingTrainer = trainersMap.get(trainer.user_id)!;
            trainersMap.set(trainer.user_id, {
              ...existingTrainer,
              ...trainer,
              // Preserve the ID from trainers table as it's the primary ID
              id: trainer.id,
            });
          } else if (trainer.user_id) {
            // Add using user_id as key
            trainersMap.set(trainer.user_id, trainer);
          } else {
            // Fallback to using id as key if no user_id
            trainersMap.set(trainer.id, trainer);
          }
        });
        
        // Convert map to array
        const combinedTrainers = Array.from(trainersMap.values());
        
        console.log("Final combined trainers count:", combinedTrainers.length);
        console.log("Final trainers list:", combinedTrainers);
        
        return combinedTrainers;
      } catch (error) {
        console.error("Error fetching trainers:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });
}
