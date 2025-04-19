
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
        
        // Fetch items directly if the RPC function fails
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
          
          return basicItems.map(item => ({
            ...item,
            // Include bare minimum structure to prevent type errors
            bookings: undefined
          }));
        };
        
        try {
          // Try to use the RPC function first
          const { data: enhancedItems, error: enhancedItemsError } = await supabase
            .rpc('get_invoice_items_with_details', { p_invoice_id: invoiceId });
            
          if (enhancedItemsError) {
            console.error("Error fetching enhanced invoice items:", enhancedItemsError);
            console.log("Falling back to direct item fetch");
            const basicItems = await fetchItemsDirectly();
            return {
              ...normalizedInvoice,
              items: basicItems
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
          const processedItems = enhancedItems.map((item: any) => {
            const processedItem: InvoiceItem = {
              id: item.id,
              invoice_id: item.invoice_id,
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
          console.error("Error processing enhanced items:", error);
          const basicItems = await fetchItemsDirectly();
          return {
            ...normalizedInvoice,
            items: basicItems
          } as Invoice;
        }
      } catch (error) {
        console.error("Error in useInvoiceDetails:", error);
        throw error;
      }
    },
    enabled: !!invoiceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
