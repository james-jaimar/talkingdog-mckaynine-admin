import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trainer } from "../types/trainer";

export function useTrainersList() {
  return useQuery({
    queryKey: ['trainers-list'],
    queryFn: async () => {
      try {
        console.log("[useTrainersList] Fetching trainers from both profiles and trainers tables");
        
        // STEP 1: Get trainers from profiles table (users with trainer role)
        const { data: trainersProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, role, created_at, updated_at')
          .or('role.eq.trainer,role.like.%trainer%');
        
        if (profilesError) {
          console.error("[useTrainersList] Error fetching trainers from profiles:", profilesError);
          throw profilesError;
        }
        
        console.log("[useTrainersList] Profiles with trainer role:", trainersProfiles?.length);
        
        // STEP 2: Get trainers from trainers table with branch data
        const { data: trainersTable, error: trainersError } = await supabase
          .from('trainers')
          .select(`
            *,
            branches:branch_id (
              name
            )
          `);
        
        if (trainersError) {
          console.error("[useTrainersList] Error fetching trainers from trainers table:", trainersError);
          throw trainersError;
        }
        
        console.log("[useTrainersList] Trainers from trainers table:", trainersTable?.length);

        // Filter to ensure we only get profiles that actually contain 'trainer' role
        const filteredProfileTrainers = trainersProfiles?.filter(profile => {
          if (!profile.role) return false;
          
          // Check if 'trainer' exists as a standalone role or as part of a comma-separated list
          const roles = profile.role.split(',').map(r => r.trim().toLowerCase());
          return roles.includes('trainer') || roles.includes('admin');
        }) || [];
        
        console.log("[useTrainersList] Filtered trainer profiles:", filteredProfileTrainers.length);

        // Transform profile trainers to match Trainer interface
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
            branch_names: null,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          };
        });

        // Combine both sources of trainers using a Map to deduplicate
        const trainersMap = new Map<string, Trainer>();
        
        // Add trainers from the profiles table first
        profileTrainers.forEach(trainer => {
          trainersMap.set(trainer.id, trainer);
        });
        
        // Then add/override with data from the trainers table
        trainersTable?.forEach(trainer => {
          // Extract branch name if available
          const branchNames = trainer.branches ? [trainer.branches.name] : null;
          
          // If this trainer has a user_id that matches a profile trainer, merge the data
          if (trainer.user_id && trainersMap.has(trainer.user_id)) {
            const existingTrainer = trainersMap.get(trainer.user_id)!;
            // We want to keep the user_id-indexed entry but with trainer table data
            trainersMap.set(trainer.user_id, {
              ...existingTrainer,
              ...trainer,
              branch_names: branchNames,
              // Use trainer.id as a reference to the trainers table entry
              id: trainer.id,
              // But keep the user_id reference to match with the profiles table
              user_id: trainer.user_id
            });
            
            // Also add an entry with the trainer.id if different from user_id
            if (trainer.id !== trainer.user_id) {
              trainersMap.delete(trainer.id); // Remove any potential conflict
            }
          } else {
            // For trainers without user_id or not in profiles, add them directly
            trainersMap.set(trainer.id, {
              ...trainer,
              branch_names: branchNames,
            });
          }
        });
        
        // Convert map to array
        const combinedTrainers = Array.from(trainersMap.values());
        
        console.log("[useTrainersList] Final combined trainers:", combinedTrainers.length);
        return combinedTrainers;
      } catch (error) {
        console.error("[useTrainersList] Error fetching trainers:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });
}
