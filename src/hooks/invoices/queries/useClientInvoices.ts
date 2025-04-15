
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "../types";
import { handleQueryError } from "./useQueryUtils";
import { useBranch } from "@/context/BranchContext";

/**
 * Hook to fetch invoices for a specific client
 */
export function useClientInvoices(clientId?: string) {
  const { currentBranch } = useBranch();
  const branchId = currentBranch?.id;

  return useQuery({
    queryKey: ['client-invoices', clientId, branchId],
    queryFn: async () => {
      if (!clientId) {
        return [];
      }

      try {
        console.log(`Fetching invoices for client ${clientId} in branch ${currentBranch?.name}`);
        
        // First, verify that the client belongs to the current branch
        if (branchId) {
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('branch_id')
            .eq('id', clientId)
            .maybeSingle();
            
          if (clientError) {
            throw clientError;
          }
          
          if (!clientData || clientData.branch_id !== branchId) {
            console.warn(`Client ${clientId} does not belong to current branch ${currentBranch?.name}`);
            return [];
          }
        }
        
        // Fetch invoices for this client
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            items:invoice_items(*)
          `)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }
        
        return data as Invoice[];
      } catch (error) {
        return handleQueryError(error, "Error fetching client invoices");
      }
    },
    enabled: !!clientId && !!branchId,
  });
}
