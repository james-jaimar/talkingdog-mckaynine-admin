
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
        console.log(`Fetching invoices for client ${clientId} in branch ${currentBranch?.name || 'unknown'}`);
        
        // Check if client belongs to the current branch via client_branches junction table
        if (branchId) {
          const { data: clientBranchData, error: cbError } = await supabase
            .from('client_branches')
            .select('branch_id')
            .eq('client_id', clientId)
            .eq('branch_id', branchId)
            .maybeSingle();
            
          if (cbError) {
            console.error("Error checking client branch access:", cbError);
            throw cbError;
          }
          
          // If the client doesn't have access to this branch, return empty invoices
          if (!clientBranchData) {
            console.warn(`Client ${clientId} does not have access to current branch ${currentBranch?.name}`);
            return [];
          }
        }
        
        // Fetch invoices where client is primary OR additional recipient
        // First get invoice IDs where this client is an additional recipient
        const { data: additionalRecipientData } = await supabase
          .from('invoice_additional_recipients')
          .select('invoice_id')
          .eq('client_id', clientId);
        
        const additionalInvoiceIds = (additionalRecipientData || []).map(r => r.invoice_id);
        
        // Build query for invoices owned by or shared with this client
        let query = supabase
          .from('invoices')
          .select(`
            *,
            items:invoice_items(
              id,
              description,
              quantity,
              unit_price,
              amount,
              booking_id
            )
          `)
          .eq('branch_id', branchId)
          .order('created_at', { ascending: false });
        
        // Use OR filter: client_id matches OR id is in additional recipient list
        if (additionalInvoiceIds.length > 0) {
          query = query.or(`client_id.eq.${clientId},id.in.(${additionalInvoiceIds.join(',')})`);
        } else {
          query = query.eq('client_id', clientId);
        }
        
        const { data, error } = await query;

        if (error) {
          console.error("Error fetching client invoices:", error);
          throw error;
        }
        
        console.log(`Retrieved ${data?.length || 0} invoices for client ${clientId}`);
        
        // Normalize items array (don't recalculate totals — DB values include discounts)
        const processedInvoices = data.map(invoice => ({
          ...invoice,
          items: invoice.items || [],
        }));
        
        return processedInvoices as unknown as Invoice[];
      } catch (error) {
        return handleQueryError(error, "Error fetching client invoices");
      }
    },
    enabled: !!clientId && !!branchId,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });
}
