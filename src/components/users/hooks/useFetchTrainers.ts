
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trainer } from "@/components/trainers/types/trainer";

export function useFetchTrainers() {
  return useQuery({
    queryKey: ['trainers-admin'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('trainers')
          .select('*');
        
        if (error) {
          console.error("Error fetching trainers:", error);
          throw error;
        }
        
        return data as Trainer[];
      } catch (error) {
        console.error("Error in useFetchTrainers:", error);
        throw error;
      }
    },
  });
}
