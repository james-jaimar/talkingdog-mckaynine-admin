
import { useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useTrainerProfile(
  user: User | null,
  isTrainer: boolean | undefined,
  setTrainerProfile: (profile: any) => void
) {
  useEffect(() => {
    // Only fetch trainer profile if user exists and is a trainer
    if (user && isTrainer) {
      const fetchTrainerProfile = async () => {
        console.log("Fetching profile for user ID:", user.id);
        
        try {
          // Use maybeSingle instead of single to avoid 406 errors
          const { data, error } = await supabase
            .from('trainers')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error("Error fetching trainer profile:", error);
            setTrainerProfile(null);
          } else {
            console.log("Fetched trainer profile:", data);
            setTrainerProfile(data);
          }
        } catch (err) {
          console.error("Exception in fetchTrainerProfile:", err);
          setTrainerProfile(null);
        }
      };
      
      fetchTrainerProfile();
    } else {
      // Clear trainer profile if user is not a trainer
      setTrainerProfile(null);
    }
  }, [user, isTrainer, setTrainerProfile]);
}
