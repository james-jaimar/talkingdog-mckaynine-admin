
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTerm } from "@/context/TermContext";

/**
 * Validates if a status string matches the expected consent status values
 */
const validateConsentStatus = (status: string | null): "yes" | "no" | "not_marked" => {
  if (status === "yes") return "yes";
  if (status === "no") return "no";
  return "not_marked";
};

export function useClassHandlers(classId: string) {
  const { termData, selectedYear, selectedTermNumber } = useTerm();

  return useQuery({
    queryKey: ['class-handlers', classId, termData?.id, selectedYear, selectedTermNumber],
    queryFn: async () => {
      // Validate classId
      if (!classId) {
        console.error("Missing classId in useClassHandlers");
        throw new Error("Missing class ID");
      }
      
      try {
        console.log(`Fetching handlers for class ${classId} with term: ${termData?.id || 'none'}, year: ${selectedYear}, term number: ${selectedTermNumber}`);
        
        // First, get all schedules for this class
        let scheduleQuery = supabase
          .from('class_schedules')
          .select('id, term_id, term_number, academic_year, selected_dates')
          .eq('class_id', classId);
        
        const { data: allSchedules, error: scheduleError } = await scheduleQuery;
          
        if (scheduleError) {
          console.error("Error fetching schedule IDs:", scheduleError);
          throw scheduleError;
        }
        
        if (!allSchedules || allSchedules.length === 0) {
          console.log(`No schedules found for class: ${classId}`);
          return [];
        }
        
        // Filter schedules based on term criteria
        let filteredSchedules = allSchedules;
        
        if (termData) {
          filteredSchedules = allSchedules.filter(schedule => {
            // Match by term_id if it's a real term (not default)
            if (termData.id && !termData.id.startsWith('default') && schedule.term_id === termData.id) {
              return true;
            }
            
            // Match by term_number and academic_year if it's a default term or term_id isn't available
            if (schedule.term_number === selectedTermNumber && schedule.academic_year === selectedYear) {
              return true;
            }
            
            // Also include schedules with dates that fall within the current term date range
            if (termData.start_date && termData.end_date && schedule.selected_dates && schedule.selected_dates.length) {
              // Check if any of the selected dates falls within the term date range
              const termStart = new Date(termData.start_date);
              const termEnd = new Date(termData.end_date);
              
              return schedule.selected_dates.some(dateStr => {
                const scheduleDate = new Date(dateStr);
                return scheduleDate >= termStart && scheduleDate <= termEnd;
              });
            }
            
            return false;
          });
        }
        
        // If no schedules match our criteria, return empty array
        if (!filteredSchedules.length) {
          console.log(`No schedules found for class: ${classId} in selected term`);
          return [];
        }
        
        const scheduleIdList = filteredSchedules.map(s => s.id);
        console.log(`Found ${scheduleIdList.length} schedules for class: ${classId} in selected term`);
        
        // Then fetch bookings for these schedules
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

        console.log(`Found ${data.length} handlers for class ${classId}`);

        return data.map(booking => {
          // Ensure consent statuses conform to the expected type
          const whatsAppStatus = validateConsentStatus(booking.clients?.uses_whatsapp_status);
          const socialMediaStatus = validateConsentStatus(booking.clients?.social_media_consent_status);

          return {
            ...booking,
            computed_payment_status: booking.payment_status,
            info_eo_status: booking.info_eo ? true : null,
            info_pg_status: booking.info_pg ? true : null,
            // Make sure clients object has properly typed status fields
            clients: booking.clients ? {
              ...booking.clients,
              uses_whatsapp_status: whatsAppStatus,
              social_media_consent_status: socialMediaStatus
            } : undefined
          };
        });
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
