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
      
      // Get all invoices with client data in a single query with better joining
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
              dogs:dog_id (name),
              class_schedules:class_schedule_id (
                id,
                classes:class_id (name)
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
          const firstItem = invoice.invoice_items[0];
          if (firstItem.bookings) {
            dogInfo = firstItem.bookings.dogs?.name;
            classInfo = firstItem.bookings.class_schedules?.classes?.name;
          }
        }
        
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
            amount: item.amount
          }))
        };
      });
      
      return transformedData as Invoice[];
    },
  });
}
