
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "../types";
import { handleQueryError } from "./useQueryUtils";

/**
 * Hook to fetch all invoices with client information
 */
export function useInvoicesList() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id (id, first_name, last_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return handleQueryError(error, "Error fetching invoices");
      }
      
      return data as Invoice[];
    },
  });
}
