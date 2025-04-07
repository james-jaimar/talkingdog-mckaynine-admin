
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "../types";
import { handleQueryError } from "./useQueryUtils";

/**
 * Hook to fetch all invoices with client information
 */
export function useInvoicesList() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      console.log("Fetching all invoices with client and booking data");
      
      // Get all invoices with client data and more complete booking info
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            id, 
            first_name, 
            last_name, 
            email, 
            phone, 
            address, 
            city, 
            postal_code
          ),
          invoice_items (
            id,
            description,
            quantity,
            unit_price,
            amount,
            booking_id,
            bookings:booking_id (
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
                  description
                )
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching invoices:", error);
        return handleQueryError(error, "Error fetching invoices");
      }
      
      console.log(`Retrieved ${data?.length || 0} invoices with client and item data`);
      
      // Transform the data to ensure client information is consistent
      // and add class/dog information to the invoice summary
      const transformedData = data?.map(invoice => {
        // Get class and dog information from the first item if available
        let classInfo = null;
        let dogInfo = null;
        
        if (invoice.invoice_items && invoice.invoice_items.length > 0) {
          // Look through all items for class and dog info
          for (const item of invoice.invoice_items) {
            if (item.bookings) {
              // If we find an item with dog and class info, store it
              if (item.bookings.dogs?.name) {
                dogInfo = item.bookings.dogs?.name;
              }
              if (item.bookings.class_schedules?.classes?.name) {
                classInfo = item.bookings.class_schedules?.classes?.name;
              }
              // Once we have both pieces of info, we can stop looking
              if (dogInfo && classInfo) break;
            }
          }
        }
        
        console.log(`Invoice ${invoice.invoice_number} - Found class: ${classInfo}, dog: ${dogInfo}`);
        
        return {
          ...invoice,
          client: invoice.clients || null,
          classInfo,
          dogInfo,
          // Keep only basic item info for list view
          items: invoice.invoice_items?.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
            booking_id: item.booking_id,
            // Keep minimal booking information for the list view
            bookings: item.bookings ? {
              id: item.bookings.id,
              dogs: item.bookings.dogs ? {
                name: item.bookings.dogs.name,
                breed: item.bookings.dogs.breed || 'Unknown' // Ensure breed is always present
              } : undefined,
              class_schedules: item.bookings.class_schedules ? {
                id: item.bookings.class_schedules.id,
                start_time: item.bookings.class_schedules.start_time || new Date().toISOString(), // Add the missing required field
                class_id: item.bookings.class_schedules.class_id,
                classes: item.bookings.class_schedules.classes ? {
                  id: item.bookings.class_schedules.classes.id,
                  name: item.bookings.class_schedules.classes.name,
                  price: 0, // Default value to satisfy the type
                  description: item.bookings.class_schedules.classes.description
                } : undefined
              } : undefined
            } : null
          }))
        };
      });
      
      // First cast to unknown, then to Invoice[] to satisfy TypeScript
      return transformedData as unknown as Invoice[];
    },
  });
}
