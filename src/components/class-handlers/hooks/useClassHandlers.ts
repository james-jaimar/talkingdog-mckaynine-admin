
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Booking } from "../types/booking";

export function useClassHandlers(classId: string) {
  return useQuery({
    queryKey: ['class-handlers', classId],
    queryFn: async () => {
      // Validate classId
      if (!classId) {
        console.error("Missing classId in useClassHandlers");
        throw new Error("Missing class ID");
      }
      
      try {
        // Get all schedule IDs for this class
        const { data: scheduleIds, error: scheduleError } = await supabase
          .from('class_schedules')
          .select('id')
          .eq('class_id', classId);
        
        if (scheduleError) {
          console.error("Error fetching schedule IDs:", scheduleError);
          throw scheduleError;
        }
        
        if (!scheduleIds || scheduleIds.length === 0) {
          console.log("No schedules found for class:", classId);
          return [];
        }
        
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
            info_pg,
            class_schedule_id,
            status,
            payment_status,
            dog_id,
            client_id,
            dogs:dog_id(id, name, breed),
            clients:client_id(
              id, 
              first_name, 
              last_name, 
              email, 
              phone,
              uses_whatsapp_status,
              social_media_consent_status
            ),
            invoice_items(
              invoice_id,
              invoices:invoice_id(
                id, 
                payment_received
              )
            ),
            attendances:class_attendance(
              id,
              class_date,
              attendance_status
            )
          `)
          .in('class_schedule_id', scheduleIdList);
        
        if (error) {
          console.error("Error fetching bookings:", error);
          throw error;
        }

        return data.map(booking => ({
          ...booking,
          computed_payment_status: booking.payment_status,
          info_eo_status: booking.info_eo ? true : null,
          info_pg_status: booking.info_pg ? true : null,
        }));
      } catch (err) {
        console.error("Error in useClassHandlers:", err);
        throw err;
      }
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 15000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
