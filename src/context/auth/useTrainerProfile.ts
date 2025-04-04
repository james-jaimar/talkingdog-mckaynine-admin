
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

/**
 * Hook to fetch trainer profile data when the user is a trainer
 */
export const useTrainerProfile = (
  user: User | null, 
  isTrainer: boolean, 
  setTrainerProfile: (profile: any) => void
) => {
  useEffect(() => {
    const fetchTrainerProfile = async () => {
      if (user && isTrainer) {
        try {
          const { data, error } = await supabase
            .from('trainers')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error("Error fetching trainer profile:", error);
            setTrainerProfile(null);
          } else {
            setTrainerProfile(data);
          }
        } catch (error) {
          console.error("Error in fetchTrainerProfile:", error);
          setTrainerProfile(null);
        }
      } else {
        setTrainerProfile(null);
      }
    };

    fetchTrainerProfile();
  }, [user, isTrainer, setTrainerProfile]);
};
