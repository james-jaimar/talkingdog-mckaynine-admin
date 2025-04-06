
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "../types";
import { handleQueryError } from "./useQueryUtils";

/**
 * Hook to fetch invoices for the currently authenticated user
 */
export function useMyInvoices() {
  return useQuery({
    queryKey: ['my-invoices'],
    queryFn: async () => {
      try {
        // First get the current user's information
        const { data: authUser } = await supabase.auth.getUser();
        if (!authUser.user) throw new Error('Not authenticated');
        
        // Then find this user's client record by email
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('email', authUser.user.email)
          .maybeSingle(); // Use maybeSingle() to prevent errors if no result
        
        if (clientError) throw clientError;
        if (!clientData) throw new Error('No client record found for this user');
        
        // Then get the client's invoices
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            items:invoice_items(*)
          `)
          .eq('client_id', clientData.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data as Invoice[];
      } catch (error) {
        return handleQueryError(error, "Error fetching client invoices");
      }
    },
  });
}
