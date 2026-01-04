
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem } from "../types";
import { handleQueryError } from "./useQueryUtils";
import { useBranch } from "@/context/BranchContext";

/**
 * Hook to fetch all invoices with client information
 */
export function useInvoicesList() {
  // Access current branch for filtering
  const { currentBranch } = useBranch();
  const branchId = currentBranch?.id;
  
  return useQuery({
    queryKey: ['invoices', branchId], // Include branchId in the query key for proper cache invalidation
    queryFn: async () => {
      console.log("Fetching invoices filtered by branch:", currentBranch?.name);
      
      try {
        // First, fetch invoices with client data, filtered by branch
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            *,
            clients!inner (*, branch_id)
          `)
          .eq('clients.branch_id', branchId)
          .order('created_at', { ascending: false });

        if (invoicesError) {
          console.error("Error fetching invoices basic data:", invoicesError);
          return handleQueryError(invoicesError, "Error fetching invoices");
        }
        
        console.log(`Retrieved ${invoicesData?.length || 0} invoices for branch ${currentBranch?.name}`);
        
        if (!invoicesData || invoicesData.length === 0) {
          return [];
        }

        // Now fetch invoice items separately to avoid deep nesting permission issues
        const invoicesWithItems = await Promise.all(invoicesData.map(async (invoice) => {
          try {
            // Get invoice items for this invoice
            const { data: items, error: itemsError } = await supabase
              .from('invoice_items')
              .select('*')
              .eq('invoice_id', invoice.id);
              
            if (itemsError) {
              console.error(`Error fetching items for invoice ${invoice.id}:`, itemsError);
              return {
                ...invoice,
                client: invoice.clients,
                items: []
              };
            }

            // Process each item to include booking data
            const enhancedItems = await Promise.all((items || []).map(async (item) => {
              // Create a properly typed invoice item with invoice_id
              let enhancedItem: Partial<InvoiceItem> = {
                id: item.id,
                invoice_id: item.invoice_id, // Make sure this is included
                description: item.description || "Training services",
                quantity: item.quantity,
                unit_price: item.unit_price,
                amount: item.amount,
                booking_id: item.booking_id
              };
              
              if (!item.booking_id) {
                return enhancedItem as InvoiceItem;
              }
              
              try {
                // Fetch booking with dog and class info
                const { data: booking, error: bookingError } = await supabase
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
                  .eq('id', item.booking_id)
                  .maybeSingle();

                if (bookingError || !booking) {
                  console.warn(`Issue fetching booking data for booking ID ${item.booking_id}:`, bookingError);
                  return enhancedItem as InvoiceItem;
                }

                // Now create the bookings property with proper structure
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
                
              } catch (err) {
                console.error(`Error processing booking data for item ${item.id}:`, err);
              }
              
              return enhancedItem as InvoiceItem;
            }));
            
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
            
          } catch (error) {
            console.error(`Error processing invoice ${invoice.id}:`, error);
            return {
              ...invoice,
              client: invoice.clients || null,
              items: []
            };
          }
        }));

        // Return as Invoice array with type assertion to satisfy TypeScript
        return invoicesWithItems as unknown as Invoice[];
        
      } catch (error) {
        console.error("Unexpected error in useInvoicesList:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!branchId, // Only run query when branch is selected
  });
}
