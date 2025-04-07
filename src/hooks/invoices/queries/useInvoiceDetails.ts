
import { useQuery } from "@tanstack/react-query";
import { Invoice, InvoiceItem } from "@/hooks/invoices/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { enhanceInvoiceItem } from "./utils/invoiceItemEnhancer";

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

        // Fetch invoice with client data directly in one query
        const { data: invoice, error } = await supabase
          .from('invoices')
          .select(`
            *,
            clients:client_id (*)
          `)
          .eq('id', invoiceId)
          .single();

        if (error) {
          console.error("Error fetching invoice:", error);
          toast.error("Could not retrieve invoice details");
          throw error;
        }

        if (!invoice) {
          toast.error("Invoice not found");
          throw new Error("Invoice not found");
        }

        console.log("Invoice with client data:", invoice);
        
        // Fetch invoice items with booking details in a single query
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
                  price,
                  description
                )
              )
            )
          `)
          .eq('invoice_id', invoiceId);
          
        if (itemsError) {
          console.error("Error fetching invoice items:", itemsError);
          toast.error("Could not retrieve invoice items");
          return {
            ...invoice,
            items: []
          } as Invoice;
        }
        
        console.log("Retrieved invoice items with booking data:", items);

        // If no items, create a default one based on the invoice total
        if (!items || items.length === 0) {
          console.log("No items found, creating default item");
          const defaultItem: InvoiceItem = {
            description: "Training services",
            quantity: 1,
            unit_price: invoice.total,
            amount: invoice.total
          };
          
          return {
            ...invoice,
            items: [defaultItem]
          } as Invoice;
        }
        
        // Return complete invoice with items
        const result = {
          ...invoice,
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
