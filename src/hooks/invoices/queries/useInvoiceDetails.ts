
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem } from "../types";
import { toast } from "sonner";
import { handleQueryError } from "./useQueryUtils";

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
        
        // Fetch invoice items directly without linking to users table
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

        // Now for each item with a booking_id, try to fetch the booking details
        const enhancedItems: InvoiceItem[] = await Promise.all(
          itemsData.map(async (item) => {
            let enhancedItem = { ...item } as InvoiceItem;

            if (item.booking_id) {
              // Try to fetch booking details
              const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .select(`
                  id, 
                  dog_id,
                  class_schedule_id
                `)
                .eq('id', item.booking_id)
                .single();

              if (!bookingError && booking) {
                // Try to fetch dog name separately
                if (booking.dog_id) {
                  const { data: dog } = await supabase
                    .from('dogs')
                    .select('name, breed')
                    .eq('id', booking.dog_id)
                    .single();

                  if (dog) {
                    enhancedItem.bookings = {
                      ...booking,
                      dogs: dog
                    };
                  }
                }

                // Try to fetch class details separately
                if (booking.class_schedule_id) {
                  const { data: classSchedule } = await supabase
                    .from('class_schedules')
                    .select(`
                      id,
                      start_time,
                      classes:class_id (id, name, description, price)
                    `)
                    .eq('id', booking.class_schedule_id)
                    .single();

                  if (classSchedule) {
                    enhancedItem.bookings = {
                      ...(enhancedItem.bookings || booking),
                      class_schedules: classSchedule
                    };
                  }
                }
              }
            }

            // If we have class data, use it to improve description and price
            const booking = enhancedItem.bookings;
            const classData = booking?.class_schedules?.classes;
            const dogData = booking?.dogs;
            
            if (classData) {
              // If no description was provided, create one using the class data
              if (!item.description || item.description === 'Class booking') {
                enhancedItem.description = classData.name;
                
                // Add dog name if available
                if (dogData?.name) {
                  enhancedItem.description += ` - ${dogData.name}`;
                }
              }
              
              // If price wasn't set correctly, use the class price
              if ((item.unit_price === 0 || !item.unit_price) && classData.price) {
                enhancedItem.unit_price = classData.price;
                enhancedItem.amount = classData.price * item.quantity;
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
