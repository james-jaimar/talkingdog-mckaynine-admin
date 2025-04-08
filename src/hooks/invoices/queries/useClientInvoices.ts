
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem } from "../types";
import { handleQueryError } from "./useQueryUtils";
import { InvoiceItemWithDetails } from "@/integrations/supabase/custom-types";

/**
 * Hook to fetch invoices for a specific client with complete details
 */
export function useClientInvoices(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-invoices', clientId],
    queryFn: async () => {
      console.log(`Fetching invoices for client ID: ${clientId}`);
      
      try {
        if (!clientId) {
          throw new Error("Client ID is required");
        }
      
        // First, fetch the basic invoice data
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            *,
            clients (*)
          `)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });
  
        if (invoicesError) {
          console.error("Error fetching client invoices:", invoicesError);
          return handleQueryError(invoicesError, "Error fetching client invoices");
        }
        
        console.log(`Retrieved ${invoicesData?.length || 0} invoices for client ${clientId}`);
        
        if (!invoicesData || invoicesData.length === 0) {
          return [];
        }
  
        // Process each invoice to include items and booking details
        const processedInvoices = await Promise.all(invoicesData.map(async (invoice) => {
          try {
            // Use our new secure function to fetch invoice items with booking details
            const { data: enhancedItems, error: enhancedItemsError } = await supabase
              .rpc('get_invoice_items_with_details', { p_invoice_id: invoice.id });
              
            if (enhancedItemsError) {
              console.error(`Error fetching enhanced items for invoice ${invoice.id}:`, enhancedItemsError);
              return {
                ...invoice,
                client: invoice.clients,
                items: []
              };
            }
            
            // Process the enhanced items to match our expected InvoiceItem structure
            const processedItems = (enhancedItems || []).map((item: InvoiceItemWithDetails) => {
              const processedItem: InvoiceItem = {
                id: item.id,
                invoice_id: item.invoice_id,
                description: item.description || "Training services",
                quantity: item.quantity,
                unit_price: item.unit_price,
                amount: item.amount,
                booking_id: item.booking_id,
                created_at: item.created_at,
                updated_at: item.updated_at
              };
              
              // Add booking data if available
              if (item.booking_details) {
                const bookingDetails = item.booking_details;
                
                // Create bookings property with properly structured data
                processedItem.bookings = {
                  id: bookingDetails.id,
                  
                  // Add dog information if available
                  dogs: bookingDetails.dog ? {
                    name: bookingDetails.dog.name,
                    breed: bookingDetails.dog.breed || 'Unknown'
                  } : undefined,
                  
                  // Add class schedule information if available
                  class_schedules: bookingDetails.class_schedule ? {
                    id: bookingDetails.class_schedule.id,
                    start_time: bookingDetails.class_schedule.start_time || new Date().toISOString(),
                    
                    // Add class information if available
                    classes: bookingDetails.class_schedule.class ? {
                      id: bookingDetails.class_schedule.class.id,
                      name: bookingDetails.class_schedule.class.name,
                      price: bookingDetails.class_schedule.class.price || 0,
                      description: bookingDetails.class_schedule.class.description || ''
                    } : undefined
                  } : undefined
                };
                
                // Update item description with class and dog info if available
                if (bookingDetails.class_schedule?.class?.name && bookingDetails.dog?.name) {
                  processedItem.description = `${bookingDetails.class_schedule.class.name} - ${bookingDetails.dog.name}`;
                }
              }
              
              return processedItem;
            });
  
            // Return complete invoice with client info and enhanced items
            return {
              ...invoice,
              client: invoice.clients || null,
              items: processedItems
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
        
        console.log("Processed invoices with enhanced items:", processedInvoices);
        return processedInvoices as Invoice[];
      } catch (error) {
        console.error("Unexpected error in useClientInvoices:", error);
        throw error;
      }
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
