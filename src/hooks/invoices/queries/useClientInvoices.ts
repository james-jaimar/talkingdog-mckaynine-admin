
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "../types";
import { handleQueryError } from "./useQueryUtils";

/**
 * Hook to fetch invoices for a specific client
 */
export function useClientInvoices(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-invoices', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        return handleQueryError(error, "Error fetching client invoices");
      }
      
      return data as Invoice[];
    },
    enabled: !!clientId,
  });
}
