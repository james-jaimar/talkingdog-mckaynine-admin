
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
        
        console.log("Invoice with normalized client data:", normalizedInvoice);
        
        // Fetch invoice items with booking details
        const { data: items, error: itemsError } = await supabase
          .from('invoice_items')
          .select(`
            *,
            bookings:booking_id (
              id,
              dog_id, 
              class_schedule_id,
              dogs:dog_id (
                id,
                name,
                breed
              ),
              class_schedules:class_schedule_id (
                id,
                start_time,
                class_id,
                classes:class_id (
                  id,
                  name,
                  description,
                  price
                )
              )
            )
          `)
          .eq('invoice_id', invoiceId);
          
        if (itemsError) {
          console.error("Error fetching invoice items:", itemsError);
          return {
            ...normalizedInvoice,
            items: []
          } as Invoice;
        }
        
        console.log("Retrieved invoice items with booking data:", items);

        // Create default item if no items
        if (!items || items.length === 0) {
          console.log("No items found, creating default item");
          const defaultItem: InvoiceItem = {
            description: "Training services",
            quantity: 1,
            unit_price: normalizedInvoice.total,
            amount: normalizedInvoice.total
          };
          
          return {
            ...normalizedInvoice,
            items: [defaultItem]
          } as Invoice;
        }
        
        // Return complete invoice with items
        const result = {
          ...normalizedInvoice,
          items: items
        } as Invoice;
        
        console.log("Final invoice data:", result);
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
