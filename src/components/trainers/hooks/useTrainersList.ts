
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trainer } from "../types/trainer";

export function useTrainersList() {
  return useQuery({
    queryKey: ['trainers-list'],
    queryFn: async () => {
      try {
        // Fetch users with trainer role
        const { data: trainers, error: trainersError } = await supabase
          .from('profiles')
          .select('*')
          .like('role', '%trainer%');
        
        if (trainersError) throw trainersError;

        // Transform the data to match our Trainer interface
        const formattedTrainers: Trainer[] = trainers.map(profile => ({
          id: profile.id,
          user_id: profile.id,
          first_name: profile.full_name?.split(' ')[0] || '',
          last_name: profile.full_name?.split(' ')[1] || '',
          email: profile.username || '',
          avatar_url: profile.avatar_url,
          phone: null,
          specialties: [],
          bio: null,
          branch_id: null,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        }));

        return formattedTrainers;
      } catch (error) {
        console.error("Error fetching trainers:", error);
        throw error;
      }
    },
  });
}
