
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
        
        // Fetch invoice items separately (not using joins which can cause permission issues)
        const { data: items, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoiceId);
          
        if (itemsError) {
          console.error("Error fetching invoice items:", itemsError);
          console.log("Continuing with empty items array");
        }
        
        // If no items, create a default one
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
        
        // Process each item to fetch booking information
        const processedItems = await Promise.all(items.map(async (item) => {
          // Create a properly typed invoice item
          let enhancedItem: InvoiceItem = { 
            id: item.id,
            description: item.description,
            quantity: item.quantity, 
            unit_price: item.unit_price,
            amount: item.amount,
            booking_id: item.booking_id
          };
          
          if (!item.booking_id) {
            return enhancedItem;
          }
          
          // Fetch booking details separately
          try {
            const { data: booking, error: bookingError } = await supabase
              .from('bookings')
              .select(`
                id,
                dog_id,
                class_schedule_id,
                dogs (
                  id,
                  name,
                  breed
                ),
                class_schedules (
                  id,
                  start_time,
                  class_id,
                  classes (
                    id,
                    name,
                    description,
                    price
                  )
                )
              `)
              .eq('id', item.booking_id)
              .maybeSingle();
              
            if (bookingError) {
              console.error(`Error fetching booking for item ${item.id}:`, bookingError);
              return enhancedItem;
            }
            
            if (!booking) {
              console.log(`No booking found for ID ${item.booking_id}`);
              return enhancedItem;
            }
            
            // Now explicitly create the bookings property on the enhanced item
            if (booking.dogs && booking.class_schedules?.classes) {
              const dogName = booking.dogs.name;
              const className = booking.class_schedules.classes.name;
              
              // If the description is generic or missing, replace it with class and dog info
              if (!item.description || 
                  item.description === 'Training services' ||
                  item.description === 'Class booking') {
                enhancedItem.description = `${className} - ${dogName}`;
                console.log(`Enhanced description for item: ${enhancedItem.description}`);
              }
              
              // Set price from class if not already set
              if (!item.unit_price || item.unit_price === 0) {
                enhancedItem.unit_price = booking.class_schedules.classes.price;
                enhancedItem.amount = booking.class_schedules.classes.price * item.quantity;
                console.log(`Enhanced price from class: ${enhancedItem.unit_price}`);
              }
              
              // Add booking information to the item
              enhancedItem.bookings = {
                id: booking.id,
                dogs: {
                  name: booking.dogs.name,
                  breed: booking.dogs.breed || 'Unknown'
                },
                class_schedules: {
                  id: booking.class_schedules.id,
                  start_time: booking.class_schedules.start_time || new Date().toISOString(),
                  class_id: booking.class_schedules.class_id,
                  classes: {
                    id: booking.class_schedules.classes.id,
                    name: booking.class_schedules.classes.name,
                    price: booking.class_schedules.classes.price || 0,
                    description: booking.class_schedules.classes.description || ''
                  }
                }
              };
            }
          } catch (err) {
            console.error(`Error processing booking for item ${item.id}:`, err);
          }
          
          return enhancedItem;
        }));
        
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
