
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Trainer option type
export type TrainerOption = {
  label: string;
  value: string;
};

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
