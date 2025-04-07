
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
        
        // CRITICAL: Fetch invoice items with complete booking information
        const { data: items, error: itemsError } = await supabase
          .from('invoice_items')
          .select(`
            *,
            bookings:booking_id (
              *,
              dogs!inner (
                id,
                name,
                breed
              ),
              class_schedules!inner (
                id,
                start_time,
                classes!inner (
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
          console.log("Continuing with empty items array");
        }
        
        // Debug the retrieved items
        console.log("Invoice items retrieved:", items);

        // Check if we have any booking-related items
        const hasBookingItems = items?.some(item => item.booking_id);
        console.log("Invoice has booking-related items:", hasBookingItems);

        // If no items found OR if items don't contain booking data but the invoice notes mention "booking"
        if (!items || items.length === 0) {
          console.log("No items found, creating default item");
          const defaultItem: InvoiceItem = {
            id: "default-item",
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

        // Process each item to ensure we have complete class and dog info
        const processedItems = items.map(item => {
          let enhancedItem = { ...item };
          
          // If this item has booking info but is missing a description
          if (item.bookings) {
            const booking = item.bookings;
            const dogName = booking.dogs?.name;
            const className = booking.class_schedules?.classes?.name;
            
            console.log(`Item ${item.id} has booking with:`, {
              dogName,
              className,
              booking_id: item.booking_id
            });
            
            // Always enhance the description if we have class and dog information
            if (className && dogName) {
              enhancedItem.description = `${className} - ${dogName}`;
              console.log(`Enhanced description for item: ${enhancedItem.description}`);
            }
            
            // Ensure we have price information
            if (booking.class_schedules?.classes?.price && (!item.unit_price || item.unit_price === 0)) {
              enhancedItem.unit_price = booking.class_schedules.classes.price;
              enhancedItem.amount = enhancedItem.unit_price * (item.quantity || 1);
              console.log(`Enhanced price from class: ${enhancedItem.unit_price}`);
            }
          } else if (item.booking_id) {
            // If we have booking_id but no booking data, we need to warn about this
            console.warn(`Item ${item.id} has booking_id ${item.booking_id} but no booking data was retrieved`);
          }
          
          return enhancedItem;
        });
        
        // Return complete invoice with processed items
        const result = {
          ...normalizedInvoice,
          items: processedItems
        } as Invoice;
        
        console.log("Final invoice data with enhanced items:", result);
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
