
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BookingWithClass {
  id: string;
  is_enrolled: boolean;
  vaccination_verified: boolean;
  proof_of_payment: string | null;
  additional_notes: string | null;
  info_eo: string | null;
  uses_whatsapp: boolean;
  social_media_consent: boolean;
  info_pg: string | null;
  class_schedule_id: string;
  dog_id: string;
  client_id: string;
  status: string;
  payment_status: string;
  notes: string | null;
  dogs?: {
    id: string;
    name: string;
    breed: string;
  };
  clients?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  class_schedules?: {
    start_time: string;
    classes?: {
      id: string;
      name: string;
      price: number;
    };
  };
}

export function useBookings(clientId: string, enabled: boolean) {
  // Fetch all bookings for this client with improved class data query
  const { data: allBookings, isLoading } = useQuery({
    queryKey: ['client-bookings', clientId, enabled],
    queryFn: async () => {
      console.log("Fetching bookings for client:", clientId);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          is_enrolled,
          vaccination_verified, 
          proof_of_payment,
          additional_notes,
          info_eo,
          uses_whatsapp,
          social_media_consent,
          info_pg,
          class_schedule_id,
          dog_id,
          client_id,
          status,
          payment_status,
          notes,
          dogs:dog_id (id, name, breed),
          clients:client_id (id, first_name, last_name, email),
          class_schedules:class_schedule_id (
            id,
            start_time,
            class_id,
            classes:class_id (id, name, price, description)
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching bookings:", error);
        throw error;
      }
      
      console.log("Fetched bookings:", data);
      return data as unknown as BookingWithClass[];
    },
    enabled: !!clientId && enabled,
  });

  // Filter to get unpaid bookings (those without proof_of_payment)
  const unpaidBookings = allBookings?.filter(b => !b.proof_of_payment) || [];
  
  // Filter to get bookings that are already in classes (paid or not)
  const enrolledBookings = allBookings?.filter(b => 
    b.class_schedules?.classes?.name && b.is_enrolled
  ) || [];
  
  console.log("Enrolled bookings:", enrolledBookings);
  console.log("Unpaid bookings:", unpaidBookings);

  return {
    allBookings,
    unpaidBookings,
    enrolledBookings,
    isLoading
  };
}
