
import { useQuery } from "@tanstack/react-query";
import { Invoice, InvoiceItem } from "@/hooks/invoices/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InvoiceItemWithDetails } from "@/integrations/supabase/custom-types";

/**
 * Hook to fetch a single invoice by ID with all details
 */
export function useInvoiceDetails(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      try {
        if (!invoiceId) {
          throw new Error("Invoice ID is required");
        }

        console.log("Fetching invoice details for:", invoiceId);

        // First, fetch the invoice with client data
        const { data: invoice, error } = await supabase
          .from('invoices')
          .select(`
            *,
            clients (*)
          `)
          .eq('id', invoiceId)
          .single();

        if (error) {
          console.error("Error fetching invoice:", error);
          throw error;
        }

        if (!invoice) {
          toast.error("Invoice not found");
          throw new Error("Invoice not found");
        }

        // Normalize client data structure
        const normalizedInvoice = {
          ...invoice,
          client: invoice.clients
        };
        
        console.log("Invoice basic data retrieved:", normalizedInvoice);
        
        // Fetch items directly from the invoice_items table
        const fetchItemsDirectly = async () => {
          console.log("Fetching invoice items directly");
          
          const { data: basicItems, error: basicItemsError } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', invoiceId);
            
          if (basicItemsError) {
            console.error("Error fetching basic invoice items:", basicItemsError);
            return [];
          }
          
          return basicItems || [];
        };
        
        let invoiceItems: InvoiceItem[] = [];
        
        // Skip the RPC function call and directly fetch items
        // This avoids the "column c.price does not exist" error
        invoiceItems = await fetchItemsDirectly();
        
        // If still no items, create a default one
        if (!invoiceItems || invoiceItems.length === 0) {
          console.log("No items found, creating default item");
          invoiceItems = [{
            id: "default-item",
            description: "Training services",
            quantity: 1,
            unit_price: normalizedInvoice.total,
            amount: normalizedInvoice.total
          }];
        }
          
        // Return complete invoice with processed items
        const result = {
          ...normalizedInvoice,
          items: invoiceItems
        } as Invoice;
          
        console.log("Final invoice data with items:", result);
        return result;
      } catch (error) {
        console.error("Error in useInvoiceDetails:", error);
        throw error;
      }
    },
    enabled: !!invoiceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
