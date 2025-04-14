
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Booking } from "../types/booking";

export function useClassHandlers(classId: string) {
  return useQuery({
    queryKey: ['class-handlers', classId],
    queryFn: async () => {
      console.log("Fetching handlers for class:", classId);
      
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
        
        console.log("Found schedule IDs:", scheduleIds);
        
        if (!scheduleIds || scheduleIds.length === 0) {
          console.log("No schedules found for class:", classId);
          return [];
        }
        
        const scheduleIdList = scheduleIds.map(s => s.id);
        
        // Optimized query that fetches booking data, related invoice data, and attendance in a single call
        // FIXED: Removed 'notes' from attendance selection since it doesn't exist in the class_attendance table
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
        
        if (error) {
          console.error("Error fetching bookings:", error);
          throw error;
        }
        
        console.log("Found bookings:", data?.length || 0);
        
        // Ensure data is an array
        if (!data) return [];
        
        // Process bookings to determine payment status
        const processedBookings = data.map(booking => {
          try {
            // Check if any associated invoice is paid
            const hasPaidInvoice = booking.invoice_items?.some(item => 
              item?.invoices && item?.invoices?.payment_received
            );
            
            // Flag bookings as unpaid if they have no proof of payment and no paid invoice
            const isUnpaid = (!booking.proof_of_payment || booking.proof_of_payment === '') && !hasPaidInvoice;
            
            // Clean up the structure by removing the invoice_items array which is no longer needed
            const { invoice_items, ...bookingData } = booking;
            
            // Process attendance data to ensure it's properly formatted
            const attendances = booking.attendances || [];
            
            // Return the booking with the computed payment status
            return {
              ...bookingData,
              computed_payment_status: isUnpaid ? 'unpaid' : 'paid',
              attendances
            } as Booking;
          } catch (err) {
            console.error("Error processing booking:", err, booking);
            // Return a fallback version of the booking to prevent the entire query from failing
            return {
              ...booking,
              computed_payment_status: 'unknown',
              attendances: booking.attendances || []
            } as Booking;
          }
        });
        
        return processedBookings;
      } catch (err) {
        console.error("Critical error in useClassHandlers:", err);
        throw err;
      }
    },
    // Reduced refetch interval to prevent excessive API calls
    refetchInterval: 30000,
    // Enable refetching when window gets focus
    refetchOnWindowFocus: true,
    // Stale time of 15 seconds to reduce unnecessary refetches
    staleTime: 15000,
    // Retry failed requests 3 times with exponential backoff
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
