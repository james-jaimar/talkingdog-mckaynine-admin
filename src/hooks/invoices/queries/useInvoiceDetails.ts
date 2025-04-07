
import { useQuery } from "@tanstack/react-query";
import { Invoice, InvoiceItem } from "@/hooks/invoices/types";
import { 
  fetchInvoiceWithClient, 
  fetchInvoiceItems, 
  createDefaultInvoiceItem,
  enhanceInvoiceItem,
  handleQueryError
} from "./useQueryUtils";

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

        // Fetch base invoice with client information
        const invoice = await fetchInvoiceWithClient(invoiceId);
        
        // Fetch invoice items
        const items = await fetchInvoiceItems(invoiceId);
        
        // Handle case with no items
        if (!items || items.length === 0) {
          console.warn("No items found for this invoice");
          
          // Create a default item based on the invoice total if no items exist
          if (invoice.total > 0) {
            const defaultItem = createDefaultInvoiceItem(invoice.total);
            return {
              ...invoice,
              items: [defaultItem]
            } as Invoice;
          }
          
          return {
            ...invoice,
            items: []
          } as Invoice;
        }
        
        // Enhance each item with booking details
        const enhancedItems: InvoiceItem[] = await Promise.all(
          items.map(item => enhanceInvoiceItem(item))
        );

        console.log("Enhanced invoice items:", enhancedItems);

        // Return the complete invoice with enhanced items
        return {
          ...invoice,
          items: enhancedItems
        } as Invoice;
      } catch (error) {
        return handleQueryError(error, "Error in useInvoiceDetails");
      }
    },
    enabled: !!invoiceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
