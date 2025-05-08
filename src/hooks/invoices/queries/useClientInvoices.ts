
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
        
        // First, verify that the client belongs to the current branch
        if (branchId) {
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('branch_id')
            .eq('id', clientId)
            .maybeSingle();
            
          if (clientError) {
            console.error("Error fetching client data:", clientError);
            throw clientError;
          }
          
          if (!clientData || clientData.branch_id !== branchId) {
            console.warn(`Client ${clientId} does not belong to current branch ${currentBranch?.name}`);
            return [];
          }
        }
        
        // Fetch invoices for this client with detailed information
        const { data, error } = await supabase
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
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching client invoices:", error);
          throw error;
        }
        
        console.log(`Retrieved ${data?.length || 0} invoices for client ${clientId}`);
        
        // Perform additional validation and data transformation
        const processedInvoices = data.map(invoice => {
          // Make sure items is always an array, even if null from database
          const items = invoice.items || [];
          
          // Calculate totals to ensure consistency
          const subtotal = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
          const taxAmount = subtotal * (invoice.tax_rate / 100);
          const total = subtotal + taxAmount;
          
          return {
            ...invoice,
            items,
            subtotal,
            tax_amount: taxAmount,
            total
          };
        });
        
        // Use explicit type assertion to resolve TypeScript error
        return processedInvoices as unknown as Invoice[];
      } catch (error) {
        return handleQueryError(error, "Error fetching client invoices");
      }
    },
    enabled: !!clientId && !!branchId,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });
}
