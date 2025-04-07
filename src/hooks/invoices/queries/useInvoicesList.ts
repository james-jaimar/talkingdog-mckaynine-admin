
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem } from "../types";
import { handleQueryError } from "./useQueryUtils";

/**
 * Hook to fetch all invoices with client information
 */
export function useInvoicesList() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      console.log("Fetching all invoices with client data");
      
      try {
        // Get all invoices with client data only first (simpler query to avoid permission issues)
        const { data: invoicesData, error: invoicesError } = await supabase
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
            )
          `)
          .order('created_at', { ascending: false });

        if (invoicesError) {
          console.error("Error fetching invoices basic data:", invoicesError);
          return handleQueryError(invoicesError, "Error fetching invoices");
        }
        
        console.log(`Retrieved ${invoicesData?.length || 0} invoices with client data`);
        
        if (!invoicesData || invoicesData.length === 0) {
          return [];
        }
        
        // Now fetch invoice items separately to avoid deep nesting that might cause permission issues
        const invoicesWithItems = await Promise.all(invoicesData.map(async (invoice) => {
          // Get invoice items for this invoice
          const { data: items, error: itemsError } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', invoice.id);
            
          if (itemsError) {
            console.error(`Error fetching items for invoice ${invoice.id}:`, itemsError);
            return {
              ...invoice,
              items: []
            };
          }
          
          // For each item that has a booking_id, get the booking details separately
          const enhancedItems = await Promise.all((items || []).map(async (item) => {
            // Create a copy of the item with the correct type structure
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
            
            // Get booking with dog and class info
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
                console.error(`Error fetching booking details for item ${item.id}:`, bookingError);
                return enhancedItem;
              }
              
              if (!booking) {
                console.log(`No booking found for ID ${item.booking_id}`);
                return enhancedItem;
              }
              
              // Add booking details to the item for display
              if (booking.dogs && booking.class_schedules?.classes) {
                const dogName = booking.dogs.name;
                const className = booking.class_schedules.classes.name;
                
                // If the description is generic or missing, replace it with class and dog info
                if (!enhancedItem.description || 
                    enhancedItem.description === 'Training services' ||
                    enhancedItem.description === 'Class booking') {
                  enhancedItem.description = `${className} - ${dogName}`;
                }
                
                // Set price from class if not already set
                if (!enhancedItem.unit_price || enhancedItem.unit_price === 0) {
                  enhancedItem.unit_price = booking.class_schedules.classes.price;
                  enhancedItem.amount = booking.class_schedules.classes.price * item.quantity;
                }
                
                // Now explicitly create the bookings property with the properly typed structure
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
          
          // Determine class and dog info from the items for the invoice summary
          let classInfo = null;
          let dogInfo = null;
          
          for (const item of enhancedItems) {
            if (item.bookings) {
              if (!dogInfo && item.bookings.dogs?.name) {
                dogInfo = item.bookings.dogs.name;
              }
              if (!classInfo && item.bookings.class_schedules?.classes?.name) {
                classInfo = item.bookings.class_schedules.classes.name;
              }
              if (dogInfo && classInfo) break;
            }
          }
          
          return {
            ...invoice,
            client: invoice.clients || null,
            items: enhancedItems,
            classInfo,
            dogInfo
          };
        }));
        
        // Return processed invoices with proper type casting
        return invoicesWithItems as Invoice[];
      } catch (error) {
        console.error("Unexpected error in useInvoicesList:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
