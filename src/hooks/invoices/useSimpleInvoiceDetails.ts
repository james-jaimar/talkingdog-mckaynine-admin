
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "./types";
import { toast } from "sonner";

export function useSimpleInvoiceDetails(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['invoice-simple', invoiceId],
    queryFn: async () => {
      try {
        if (!invoiceId) {
          throw new Error("Invoice ID is required");
        }

        // First, fetch the invoice with client data
        const { data: invoice, error } = await supabase
          .from('invoices')
          .select(`
            *,
            clients (*)
          `)
          .eq('id', invoiceId)
          .single();

        if (error) throw error;
        if (!invoice) throw new Error("Invoice not found");

        // Get invoice items in a separate query
        const { data: items, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoiceId);

        if (itemsError) throw itemsError;

        // Return the complete invoice with items and client info
        return {
          ...invoice,
          client: invoice.clients,
          items: items || []
        } as Invoice;
      } catch (error) {
        console.error("Error fetching invoice details:", error);
        throw error;
      }
    },
    enabled: !!invoiceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
