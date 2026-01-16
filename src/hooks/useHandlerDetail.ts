
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HandlerData, ConsentStatus } from "@/types/handler";
import { useToast } from "@/components/ui/use-toast";

export function useHandlerDetail(id: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      console.log("Fetching handler with ID:", id);
      
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *, 
          dogs(*),
          enrollment_registrations(
            id,
            class_type,
            class_type_other,
            heard_from,
            whatsapp_permission,
            photo_permission,
            vet_clearance_url,
            signature_name,
            signature_date,
            status,
            submitted_at,
            created_at,
            dogs(id, name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        toast({
          title: "Error fetching handler",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      // Ensure consent statuses are properly typed
      const typedData: HandlerData = {
        ...data,
        uses_whatsapp_status: (data.uses_whatsapp_status as ConsentStatus) || 'not_marked',
        social_media_consent_status: (data.social_media_consent_status as ConsentStatus) || 'not_marked',
        secondary_first_name: data.secondary_first_name || undefined,
        secondary_last_name: data.secondary_last_name || undefined,
        secondary_email: data.secondary_email || undefined,
        secondary_phone: data.secondary_phone || undefined,
        enrollment_registrations: data.enrollment_registrations || []
      };

      return typedData;
    },
    enabled: !!id,
  });
}
