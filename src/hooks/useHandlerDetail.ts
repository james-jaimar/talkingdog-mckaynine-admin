
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
          dogs(*)
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
        social_media_consent_status: (data.social_media_consent_status as ConsentStatus) || 'not_marked'
      };

      return typedData;
    },
    enabled: !!id,
  });
}
