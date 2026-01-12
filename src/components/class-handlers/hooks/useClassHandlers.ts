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
  const { termData } = useTerm();

  return useQuery({
    queryKey: ['class-handlers', classId, termData?.id],
    queryFn: async () => {
      // Validate classId
      if (!classId) {
        console.error("Missing classId in useClassHandlers");
        throw new Error("Missing class ID");
      }
      
      try {
        console.log(`Fetching handlers for class ${classId} with term: ${termData?.id || 'none'}`);
        
        // First, get all schedule IDs for this class
        let scheduleQuery = supabase
          .from('class_schedules')
          .select('id')
          .eq('class_id', classId);
        
        // Filter by term if term is selected
        if (termData?.id) {
          scheduleQuery = scheduleQuery.eq('term_id', termData.id);
          console.log(`Filtering schedules to those with term_id: ${termData.id}`);
        }
        
        const { data: scheduleIds, error: scheduleError } = await scheduleQuery;
          
        if (scheduleError) {
          console.error("Error fetching schedule IDs:", scheduleError);
          throw scheduleError;
        }
        
        if (!scheduleIds || scheduleIds.length === 0) {
          console.log(`No schedules found for class: ${classId}${termData?.id ? ` in term: ${termData.id}` : ''}`);
          return [];
        }
        
        const scheduleIdList = scheduleIds.map(s => s.id);
        console.log(`Found ${scheduleIdList.length} schedules for class: ${classId}`);
        
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
            dogs:dog_id(id, name, breed, date_of_birth),
            clients:client_id(
              id, 
              first_name, 
              last_name, 
              email, 
              phone,
              uses_whatsapp_status,
              social_media_consent_status,
              enrollment_verified,
              vaccination_verified
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
              attendance_status,
              performance_grade
            )
          `)
          .in('class_schedule_id', scheduleIdList);

        if (error) {
          console.error("Error fetching bookings:", error);
          throw error;
        }

        // Fetch enrollment_registrations for all unique client_ids
        const clientIds = [...new Set(data.map(b => b.client_id).filter(Boolean))];
        let enrollmentMap: Record<string, any[]> = {};
        
        if (clientIds.length > 0) {
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from('enrollment_registrations')
            .select('client_id, whatsapp_permission, photo_permission, created_at')
            .in('client_id', clientIds);
          
          if (!enrollmentError && enrollmentData) {
            for (const reg of enrollmentData) {
              if (!enrollmentMap[reg.client_id]) {
                enrollmentMap[reg.client_id] = [];
              }
              enrollmentMap[reg.client_id].push(reg);
            }
          }
        }

        // Helper to get consent from latest enrollment registration
        const getConsentFromRegistrations = (registrations: any[], fallbackWhatsapp: string | null, fallbackPhoto: string | null) => {
          if (!registrations || registrations.length === 0) {
            return { 
              whatsapp: validateConsentStatus(fallbackWhatsapp), 
              photo: validateConsentStatus(fallbackPhoto) 
            };
          }
          // Sort by created_at descending and get latest
          const sorted = [...registrations].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const latest = sorted[0];
          return {
            whatsapp: validateConsentStatus(latest.whatsapp_permission || fallbackWhatsapp),
            photo: validateConsentStatus(latest.photo_permission || fallbackPhoto)
          };
        };

        // IMPORTANT: Always include classId in every booking for handler completion display!
        return data.map(booking => {
          // Get consent from enrollment_registrations (priority) or fallback to client fields
          const clientEnrollments = booking.client_id ? enrollmentMap[booking.client_id] : [];
          const consent = getConsentFromRegistrations(
            clientEnrollments,
            booking.clients?.uses_whatsapp_status ?? null,
            booking.clients?.social_media_consent_status ?? null
          );

          return {
            ...booking,
            class_id: classId, // ensure completion hooks work!
            computed_payment_status: booking.payment_status,
            info_eo_status: booking.info_eo ? true : null,
            info_pg_status: booking.info_pg ? true : null,
            clients: booking.clients ? {
              ...booking.clients,
              uses_whatsapp_status: consent.whatsapp,
              social_media_consent_status: consent.photo
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
