
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "../types";
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
        
        // Fetch invoice items directly with related booking information but without linking to users table
        const { data: itemsData, error: itemsError } = await supabase
          .from('invoice_items')
          .select(`
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
              dogs:dog_id (id, name, breed),
              class_schedules:class_schedule_id (
                id,
                start_time,
                classes:class_id (id, name, description, price)
              )
            )
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

        // Process the items to enhance descriptions with class and dog details
        const processedItems = itemsData?.map(item => {
          let enhancedItem = { ...item };
          
          // If this item is linked to a booking with class and dog details
          const booking = item.bookings;
          const classData = booking?.class_schedules?.classes;
          const dogData = booking?.dogs;
          
          if (classData) {
            // If no description was provided, create one using the class and dog data
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
        }) || [];

        return {
          ...invoice,
          items: processedItems
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
