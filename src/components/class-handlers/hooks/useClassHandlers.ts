
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
      
      // Optimized query that fetches booking data, related invoice data, and attendance in a single call
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
          dog_id,
          client_id,
          dogs:dog_id(id, name, breed),
          clients:client_id(id, first_name, last_name, email, phone),
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
      
      if (error) throw error;
      
      console.log("Found bookings:", data?.length || 0);
      
      // Process bookings to determine payment status
      const processedBookings = data?.map(booking => {
        // Check if any associated invoice is paid
        const hasPaidInvoice = booking.invoice_items?.some(item => 
          item.invoices && item.invoices.payment_received
        );
        
        // Flag bookings as unpaid if they have no proof of payment and no paid invoice
        const isUnpaid = (!booking.proof_of_payment || booking.proof_of_payment === '') && !hasPaidInvoice;
        
        if (isUnpaid) {
          console.log(`Unpaid booking: ${booking.id} - ${booking.clients?.first_name} ${booking.clients?.last_name} - ${booking.dogs?.name}`);
        }
        
        // Clean up the structure by removing the invoice_items array which is no longer needed
        const { invoice_items, ...bookingData } = booking;
        
        // Return the booking with the computed payment status
        return {
          ...bookingData,
          computed_payment_status: isUnpaid ? 'unpaid' : 'paid'
        } as Booking;
      });
      
      return processedBookings || [];
    },
    // More frequent refetching (every 5 seconds)
    refetchInterval: 5000,
    // Enable refetching when window gets focus
    refetchOnWindowFocus: true,
    // Stale time of 0 means it will always refetch when needed
    staleTime: 0,
  });
}
