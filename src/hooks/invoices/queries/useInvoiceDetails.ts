
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
        
        // Fetch invoice items with direct relation to bookings
        // Avoid joining with users table which causes permission issues
        const { data: itemsData, error: itemsError } = await supabase
          .from('invoice_items')
          .select(`
            id,
            description,
            quantity,
            unit_price,
            amount,
            booking_id
          `)
          .eq('invoice_id', invoiceId);

        if (itemsError) {
          console.error("Error fetching invoice items:", itemsError);
          // Return invoice with empty items rather than failing completely
          return {
            ...invoice,
            items: []
          } as Invoice;
        }

        console.log("Successfully fetched invoice items:", itemsData);

        // Now for each item with a booking_id, fetch booking details directly
        // Avoid unnecessary joins that might require additional permissions
        const enhancedItems: InvoiceItem[] = await Promise.all(
          itemsData.map(async (item) => {
            // Base item without bookings data
            const enhancedItem: InvoiceItem = {
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              amount: item.amount,
              booking_id: item.booking_id
            };

            if (item.booking_id) {
              try {
                // Fetch basic booking info
                const { data: booking, error: bookingError } = await supabase
                  .from('bookings')
                  .select('id, dog_id, class_schedule_id')
                  .eq('id', item.booking_id)
                  .maybeSingle();

                if (!bookingError && booking) {
                  // Initialize bookings property
                  enhancedItem.bookings = {
                    id: booking.id,
                    dog_id: booking.dog_id,
                    class_schedule_id: booking.class_schedule_id
                  };

                  // Get dog information separately
                  if (booking.dog_id) {
                    const { data: dog, error: dogError } = await supabase
                      .from('dogs')
                      .select('name, breed')
                      .eq('id', booking.dog_id)
                      .maybeSingle();

                    if (!dogError && dog) {
                      if (!enhancedItem.bookings) enhancedItem.bookings = { id: booking.id };
                      enhancedItem.bookings.dogs = dog;
                    }
                  }

                  // Get class schedule information separately
                  if (booking.class_schedule_id) {
                    const { data: classSchedule, error: scheduleError } = await supabase
                      .from('class_schedules')
                      .select('id, start_time')
                      .eq('id', booking.class_schedule_id)
                      .maybeSingle();

                    if (!scheduleError && classSchedule) {
                      if (!enhancedItem.bookings) enhancedItem.bookings = { id: booking.id };
                      enhancedItem.bookings.class_schedules = { 
                        id: classSchedule.id,
                        start_time: classSchedule.start_time
                      };
                      
                      // Get class details separately to avoid complex joins
                      const { data: classData, error: classError } = await supabase
                        .from('classes')
                        .select('id, name, description, price')
                        .eq('id', (await supabase
                          .from('class_schedules')
                          .select('class_id')
                          .eq('id', booking.class_schedule_id)
                          .single()).data?.class_id)
                        .maybeSingle();

                      if (!classError && classData) {
                        if (!enhancedItem.bookings.class_schedules) {
                          enhancedItem.bookings.class_schedules = { 
                            id: classSchedule.id, 
                            start_time: classSchedule.start_time
                          };
                        }
                        enhancedItem.bookings.class_schedules.classes = classData;
                      }
                    }
                  }
                }
              } catch (error) {
                console.error("Error fetching booking details:", error);
                // Continue with basic item data even if enhanced booking details fail
              }
            }

            // If we have class data, use it to improve description and price
            if (enhancedItem.bookings?.class_schedules?.classes) {
              const classData = enhancedItem.bookings.class_schedules.classes;
              const dogData = enhancedItem.bookings.dogs;
              
              // If no description was provided, create one using the class data
              if (!enhancedItem.description || enhancedItem.description === 'Class booking') {
                enhancedItem.description = classData.name;
                
                // Add dog name if available
                if (dogData?.name) {
                  enhancedItem.description += ` - ${dogData.name}`;
                }
              }
              
              // If price wasn't set correctly, use the class price
              if ((enhancedItem.unit_price === 0 || !enhancedItem.unit_price) && classData.price) {
                enhancedItem.unit_price = classData.price;
                enhancedItem.amount = classData.price * enhancedItem.quantity;
              }
            }
            
            // Ensure amount is calculated if missing
            if (!enhancedItem.amount && enhancedItem.unit_price) {
              enhancedItem.amount = enhancedItem.quantity * enhancedItem.unit_price;
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
    retry: 1, // Only retry once to prevent excessive errors
  });
}
