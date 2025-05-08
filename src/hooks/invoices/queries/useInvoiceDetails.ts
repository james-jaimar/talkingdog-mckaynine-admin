
import { useQuery } from "@tanstack/react-query";
import { Invoice, InvoiceItem } from "@/hooks/invoices/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
        
        // Fetch invoice items
        const { data: invoiceItems, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoiceId);
          
        if (itemsError) {
          console.error("Error fetching invoice items:", itemsError);
          return {
            ...normalizedInvoice,
            items: []
          } as unknown as Invoice;
        }
        
        // If no items found, create a default one for display purposes
        if (!invoiceItems || invoiceItems.length === 0) {
          console.log("No items found, creating default item");
          
          // Return the complete invoice with a default item
          return {
            ...normalizedInvoice,
            items: [{
              id: "default-item",
              description: "Training services",
              quantity: 1,
              unit_price: normalizedInvoice.total,
              amount: normalizedInvoice.total
            }]
          } as unknown as Invoice;
        }
          
        // Return complete invoice with fetched items
        const result = {
          ...normalizedInvoice,
          items: invoiceItems
        };
          
        console.log("Final invoice data with items:", result);
        return result as unknown as Invoice;
      } catch (error) {
        console.error("Error in useInvoiceDetails:", error);
        throw error;
      }
    },
    enabled: !!invoiceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
