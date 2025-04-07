
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem } from "../types";
import { handleQueryError } from "./useQueryUtils";
import { enhanceInvoiceItem } from "./utils/invoiceItemEnhancer";

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
            // Get invoice items
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
              // Use the enhancer utility to add booking and class data
              return await enhanceInvoiceItem(item);
            }));
  
            // Return complete invoice with client info and enhanced items
            return {
              ...invoice,
              client: invoice.clients || null,
              items: enhancedItems
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
