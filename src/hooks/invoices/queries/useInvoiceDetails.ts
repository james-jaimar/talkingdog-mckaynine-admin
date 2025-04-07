
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem } from "@/hooks/invoices/types";
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

        // First get the invoice data with client information
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .select(`
            *,
            clients:client_id (id, first_name, last_name, email, phone, address, city, postal_code)
          `)
          .eq('id', invoiceId)
          .single();

        if (invoiceError) {
          console.error("Error fetching invoice:", invoiceError);
          toast.error("Could not retrieve invoice details");
          throw invoiceError;
        }

        if (!invoice) {
          toast.error("Invoice not found");
          throw new Error("Invoice not found");
        }

        console.log("Fetched invoice data:", invoice);
        
        // Fetch invoice items directly - no joins to avoid permission issues
        const { data: items, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoiceId);

        if (itemsError) {
          console.error("Error fetching invoice items:", itemsError);
          toast.error("Could not retrieve invoice items");
          return {
            ...invoice,
            items: []
          } as Invoice;
        }

        console.log("Fetched invoice items:", items);
        
        // For each item, separately fetch booking details if available
        const enhancedItems: InvoiceItem[] = await Promise.all(
          items.map(async (item) => {
            // Base item
            const enhancedItem: InvoiceItem = {
              ...item
            };
            
            // If this item is linked to a booking, fetch related info separately
            if (item.booking_id) {
              try {
                // Get booking
                const { data: booking } = await supabase
                  .from('bookings')
                  .select('dog_id, class_schedule_id')
                  .eq('id', item.booking_id)
                  .maybeSingle();
                
                if (booking) {
                  enhancedItem.bookings = {
                    id: item.booking_id
                  };
                  
                  // Get dog name if available
                  if (booking.dog_id) {
                    const { data: dog } = await supabase
                      .from('dogs')
                      .select('name, breed')
                      .eq('id', booking.dog_id)
                      .maybeSingle();
                      
                    if (dog) {
                      enhancedItem.bookings.dogs = {
                        name: dog.name,
                        breed: dog.breed
                      };
                    }
                  }
                  
                  // Get class info if available
                  if (booking.class_schedule_id) {
                    const { data: classSchedule } = await supabase
                      .from('class_schedules')
                      .select('class_id')
                      .eq('id', booking.class_schedule_id)
                      .maybeSingle();
                      
                    if (classSchedule && classSchedule.class_id) {
                      const { data: classData } = await supabase
                        .from('classes')
                        .select('name, price, description')
                        .eq('id', classSchedule.class_id)
                        .maybeSingle();
                        
                      if (classData) {
                        enhancedItem.bookings.class_schedules = {
                          id: booking.class_schedule_id,
                          classes: {
                            id: classSchedule.class_id,
                            name: classData.name,
                            price: classData.price,
                            description: classData.description || '' // Add description with fallback
                          }
                        };
                        
                        // Use class name for description if none provided
                        if (!enhancedItem.description || enhancedItem.description === 'Class booking') {
                          enhancedItem.description = classData.name;
                        }
                        
                        // Use class price if unit price is missing or zero
                        if (!enhancedItem.unit_price || enhancedItem.unit_price === 0) {
                          enhancedItem.unit_price = classData.price;
                          enhancedItem.amount = classData.price * enhancedItem.quantity;
                        }
                      }
                    }
                  }
                }
              } catch (error) {
                console.error("Error fetching booking details:", error);
                // Continue with basic item data
              }
            }
            
            return enhancedItem;
          })
        );

        console.log("Enhanced invoice items:", enhancedItems);

        return {
          ...invoice,
          items: enhancedItems
        } as Invoice;
      } catch (error) {
        console.error("Error in useInvoiceDetails:", error);
        throw error;
      }
    },
    enabled: !!invoiceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
