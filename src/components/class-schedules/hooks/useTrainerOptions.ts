
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Trainer option type
export type TrainerOption = {
  label: string;
  value: string;
};

// The ID of our special "No Trainer" record
const NO_TRAINER_ID = 'ba95153f-699c-4cc1-afe5-762bf30033d4';

export function useTrainerOptions() {
  const [trainers, setTrainers] = useState<TrainerOption[]>([]);
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(true);
  const { toast } = useToast();

  // Fetch trainers for dropdown
  useEffect(() => {
    const fetchTrainers = async () => {
      setIsLoadingTrainers(true);
      try {
        const { data, error } = await supabase
          .from("trainers")
          .select("id, first_name, last_name")
          .neq('id', NO_TRAINER_ID) // Filter out our special "No Trainer" record
          .order("last_name, first_name");
        
        if (error) {
          throw error;
        }
        
        if (data && Array.isArray(data)) {
          const trainerOptions = data.map(trainer => ({
            value: trainer.id,
            label: `${trainer.first_name} ${trainer.last_name}`
          }));
          
          setTrainers(trainerOptions);
        } else {
          setTrainers([]);
        }
      } catch (error) {
        console.error("Error fetching trainers:", error);
        toast({
          title: "Failed to load trainers",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
        setTrainers([]);
      } finally {
        setIsLoadingTrainers(false);
      }
    };
    
    fetchTrainers();
  }, [toast]);

  return {
    trainers,
    isLoadingTrainers
  };
}
