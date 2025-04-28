
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem } from "../types";
import { handleQueryError } from "./useQueryUtils";
import { useBranch } from "@/context/BranchContext";

/**
 * Optimized hook to fetch all invoices with client information
 * Reduces console logging and improves query efficiency
 */
export function useInvoicesList() {
  const { currentBranch } = useBranch();
  const branchId = currentBranch?.id;
  
  return useQuery({
    queryKey: ['invoices', branchId],
    queryFn: async () => {
      if (!branchId) {
        return [];
      }
      
      try {
        // Fetch invoices with client data, filtered by branch
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            *,
            clients!inner (*, branch_id)
          `)
          .eq('clients.branch_id', branchId)
          .order('created_at', { ascending: false });

        if (invoicesError) {
          return handleQueryError(invoicesError, "Error fetching invoices");
        }
        
        if (!invoicesData || invoicesData.length === 0) {
          return [];
        }

        // Use a more efficient batch approach for invoice items and related data
        const invoiceIds = invoicesData.map(invoice => invoice.id);
        
        // Get all items for these invoices in a single request
        const { data: allItems, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .in('invoice_id', invoiceIds);
          
        if (itemsError) {
          console.error("Error fetching invoice items:", itemsError);
        }
        
        // Group items by invoice ID for faster lookup
        const itemsByInvoice = (allItems || []).reduce((acc, item) => {
          if (!acc[item.invoice_id]) {
            acc[item.invoice_id] = [];
          }
          acc[item.invoice_id].push(item);
          return acc;
        }, {} as Record<string, any[]>);
        
        // Get all booking IDs from the items for batch fetching
        const bookingIds = allItems
          ?.filter(item => !!item.booking_id)
          .map(item => item.booking_id) || [];
        
        // Fetch all bookings with related data in a single request
        const { data: allBookings, error: bookingsError } = bookingIds.length > 0 ? 
          await supabase
            .from('bookings')
            .select(`
              id,
              dog_id,
              dogs (id, name, breed),
              class_schedule_id,
              class_schedules (
                id, 
                start_time,
                class_id,
                classes (id, name, description, course_fee)
              )
            `)
            .in('id', bookingIds) : 
          { data: [], error: null };
          
        if (bookingsError) {
          console.error("Error fetching bookings data:", bookingsError);
        }
        
        // Group bookings by ID for faster lookup
        const bookingsById = (allBookings || []).reduce((acc, booking) => {
          acc[booking.id] = booking;
          return acc;
        }, {} as Record<string, any>);

        // Process invoices with their items and bookings
        const invoicesWithItems = invoicesData.map(invoice => {
          const items = itemsByInvoice[invoice.id] || [];
          
          // Process each item to include booking data
          const enhancedItems: InvoiceItem[] = items.map(item => {
            let enhancedItem: InvoiceItem = {
              id: item.id,
              description: item.description || "Training services",
              quantity: item.quantity,
              unit_price: item.unit_price,
              amount: item.amount,
              booking_id: item.booking_id
            };
            
            // Add booking data if available
            if (item.booking_id && bookingsById[item.booking_id]) {
              const booking = bookingsById[item.booking_id];
              
              if (booking.dogs && booking.class_schedules?.classes) {
                const dogName = booking.dogs.name;
                const className = booking.class_schedules.classes.name;
                const classDescription = booking.class_schedules.classes.description;
                const classPrice = booking.class_schedules.classes.course_fee;
                
                // Update description with class and dog info
                enhancedItem.description = `${className} - ${dogName}`;
                
                // Use class price if not already set
                if (!enhancedItem.unit_price || enhancedItem.unit_price === 0) {
                  enhancedItem.unit_price = classPrice;
                  enhancedItem.amount = classPrice * item.quantity;
                }
                
                // Add booking data to the item
                enhancedItem.bookings = {
                  id: booking.id,
                  dogs: {
                    name: dogName,
                    breed: booking.dogs.breed || 'Unknown'
                  },
                  class_schedules: {
                    id: booking.class_schedules.id,
                    start_time: booking.class_schedules.start_time || new Date().toISOString(),
                    class_id: booking.class_schedules.class_id,
                    classes: {
                      id: booking.class_schedules.classes.id,
                      name: className,
                      price: classPrice || 0,
                      description: classDescription || ''
                    }
                  }
                };
              }
            }
            
            return enhancedItem;
          });
          
          // Extract class and dog info for summary
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
        });

        // Return as Invoice array with type assertion
        return invoicesWithItems as Invoice[];
        
      } catch (error) {
        console.error("Unexpected error in useInvoicesList:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!branchId,
    refetchOnWindowFocus: false,
  });
}
