
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
      console.log("Fetching all invoices with client data");
      
      // Get all invoices with client data in a single query with better joining
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            id, 
            first_name, 
            last_name, 
            email, 
            phone, 
            address, 
            city, 
            postal_code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching invoices:", error);
        return handleQueryError(error, "Error fetching invoices");
      }
      
      console.log(`Retrieved ${data?.length || 0} invoices with client data:`, data);
      
      // Transform the data to ensure client information is consistent
      const transformedData = data?.map(invoice => ({
        ...invoice,
        client: invoice.clients || null
      }));
      
      return transformedData as Invoice[];
    },
  });
}
