
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
        
        // Use our new secure function to fetch invoice items with booking details
        const { data: enhancedItems, error: enhancedItemsError } = await supabase
          .rpc('get_invoice_items_with_details', { p_invoice_id: invoiceId });
          
        if (enhancedItemsError) {
          console.error("Error fetching enhanced invoice items:", enhancedItemsError);
          console.log("Falling back to empty items array");
          
          // Fallback to a default item if there's an error
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
        
        console.log("Enhanced items retrieved from secure function:", enhancedItems);
        
        if (!enhancedItems || enhancedItems.length === 0) {
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
        
        // Process the enhanced items to match our expected InvoiceItem structure
        const processedItems = enhancedItems.map((item: InvoiceItemWithDetails) => {
          const processedItem: InvoiceItem = {
            id: item.id,
            description: item.description || "Training services",
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
            booking_id: item.booking_id,
            created_at: item.created_at,
            updated_at: item.updated_at
          };
          
          // Add booking data if available
          if (item.booking_details) {
            const bookingDetails = item.booking_details;
            
            // Create the bookings property with properly structured data
            processedItem.bookings = {
              id: bookingDetails.id,
              
              // Add dog information
              dogs: bookingDetails.dog ? {
                name: bookingDetails.dog.name,
                breed: bookingDetails.dog.breed || 'Unknown'
              } : undefined,
              
              // Add class schedule information
              class_schedules: bookingDetails.class_schedule ? {
                id: bookingDetails.class_schedule.id,
                start_time: bookingDetails.class_schedule.start_time || new Date().toISOString(),
                
                // Add class information
                classes: bookingDetails.class_schedule.class ? {
                  id: bookingDetails.class_schedule.class.id,
                  name: bookingDetails.class_schedule.class.name,
                  price: bookingDetails.class_schedule.class.price || 0,
                  description: bookingDetails.class_schedule.class.description || ''
                } : undefined
              } : undefined
            };
            
            // Update item description with class and dog info if available
            if (bookingDetails.class_schedule?.class?.name && bookingDetails.dog?.name) {
              processedItem.description = `${bookingDetails.class_schedule.class.name} - ${bookingDetails.dog.name}`;
              console.log(`Updated description for item ${item.id}: ${processedItem.description}`);
            }
          }
          
          return processedItem;
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
