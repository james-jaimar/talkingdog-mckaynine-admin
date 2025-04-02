
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Booking } from "../types/booking";

export function useClassHandlers(classId: string) {
  return useQuery({
    queryKey: ['class-handlers', classId],
    queryFn: async () => {
      console.log("Fetching handlers for class:", classId);
      
      const { data: scheduleIds, error: scheduleError } = await supabase
        .from('class_schedules')
        .select('id')
        .eq('class_id', classId);
      
      if (scheduleError) throw scheduleError;
      
      console.log("Found schedule IDs:", scheduleIds);
      
      if (!scheduleIds.length) return [];
      
      const scheduleIdList = scheduleIds.map(s => s.id);
      
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
          status,
          payment_status,
          dogs:dog_id(id, name, breed),
          clients:client_id(id, first_name, last_name, email, phone)
        `)
        .in('class_schedule_id', scheduleIdList);
      
      if (error) throw error;
      
      console.log("Found bookings:", data?.length || 0);
      
      // Check for bookings with missing proof_of_payment and log them in detail
      const unpaidBookings = data?.filter(b => !b.proof_of_payment || b.proof_of_payment === '');
      console.log(`Bookings missing proof_of_payment: ${unpaidBookings?.length || 0}`);
      unpaidBookings?.forEach(booking => {
        console.log(`Unpaid booking: ${booking.id} - ${booking.clients?.first_name} ${booking.clients?.last_name} - ${booking.dogs?.name}`);
      });
      
      return data as Booking[];
    }
  });
}
