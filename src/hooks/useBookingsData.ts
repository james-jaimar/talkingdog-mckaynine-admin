
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Booking {
  id: string;
  client_id?: string;
  dog_id?: string;
  class_schedule_id: string;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  dogs?: {
    id: string;
    name: string;
    breed: string;
  };
  class_schedules?: {
    id: string;
    start_time: string;
    classes?: {
      id: string;
      name: string;
    };
  };
}

export function useBookingsData(clientId: string, options = {}) {
  const { data: bookings, isLoading, error, refetch } = useQuery({
    queryKey: ['client-bookings', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          payment_status,
          created_at,
          updated_at,
          dogs:dog_id (id, name, breed),
          class_schedules:class_schedule_id (
            id,
            start_time,
            classes:class_id (id, name)
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching client bookings:", error);
        return [];
      }
      
      return data as Booking[];
    },
    enabled: !!clientId,
    ...options
  });
  
  return { bookings, isLoading, error, refetch };
}
