
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingStatus {
  status: 'pending' | 'completed' | null;
  isLoading: boolean;
  clientId: string | null;
}

export function useOnboardingStatus(userId: string | undefined, isHandler: boolean): OnboardingStatus {
  const [status, setStatus] = useState<'pending' | 'completed' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !isHandler) {
      setIsLoading(false);
      return;
    }

    const fetchOnboardingStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('handler_onboarding')
          .select('status, client_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching onboarding status:', error);
          setStatus(null);
        } else if (data) {
          setStatus(data.status as 'pending' | 'completed');
          setClientId(data.client_id);
        } else {
          // No onboarding record found - might be a legacy user
          // Check if they have a completed client record
          const { data: clientData } = await supabase
            .from('clients')
            .select('id, onboarding_status')
            .eq('auth_user_id', userId)
            .maybeSingle();
          
          if (clientData) {
            setStatus(clientData.onboarding_status as 'pending' | 'completed');
            setClientId(clientData.id);
          } else {
            // No client record - treat as pending
            setStatus('pending');
          }
        }
      } catch (error) {
        console.error('Error in fetchOnboardingStatus:', error);
        setStatus(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnboardingStatus();
  }, [userId, isHandler]);

  return { status, isLoading, clientId };
}
