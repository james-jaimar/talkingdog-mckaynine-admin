
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "./types";
import { getInvoiceAsBase64 } from "@/components/invoices/pdf/InvoicePDFGenerator";
import { toast } from "sonner";

export interface EmailInvoiceParams {
  invoice: Invoice;
  email: string;
  customSubject?: string;
  customEmailHtml?: string;
}

export function useEmailInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoice, email, customSubject, customEmailHtml }: EmailInvoiceParams) => {
      try {
        toast.info("Preparing invoice for email...");
        
        // Generate the PDF as base64
        const pdfBase64 = await getInvoiceAsBase64(invoice);
        if (!pdfBase64) {
          throw new Error("Failed to generate invoice PDF");
        }
        
        console.log("PDF generated successfully, preparing to send email");
        console.log("Custom email content provided:", !!customEmailHtml);
        
        // Call the send-invoice edge function
        const { data, error } = await supabase.functions.invoke('send-invoice', {
          body: {
            invoice,
            email,
            pdfBase64,
            customSubject,
            customEmailHtml,
          },
        });

        if (error) {
          console.error("Error invoking send-invoice function:", error);
          throw new Error(`Failed to send invoice: ${error.message}`);
        }

        if (!data.success) {
          console.error("Email sending failed:", data.error);
          throw new Error(data.error || "Failed to send email");
        }

        return data;
      } catch (error) {
        console.error("Error in useEmailInvoice:", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      console.log(`Email sent to ${variables.email}`);
      toast.success(`Invoice ${variables.invoice.invoice_number} sent to ${variables.email}`);
      
      // Invalidate relevant queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoice.id] });
      
      // If we have the client_id, invalidate client-specific queries
      if (variables.invoice.client_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['client-invoices', variables.invoice.client_id] 
        });
      }
    },
    onError: (error: Error) => {
      console.error("Email sending error:", error);
      toast.error(`Failed to send email: ${error.message}`);
    },
  });
}
