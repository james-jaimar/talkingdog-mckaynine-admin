
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Invoice } from "../invoices/types";
import { getInvoiceAsBase64 } from "@/components/invoices/pdf/InvoicePDFGenerator";

export function useEmailInvoice() {
  return useMutation({
    mutationFn: async ({ invoice, email }: { invoice: Invoice; email: string }) => {
      try {
        console.log(`Sending invoice ${invoice.invoice_number} to ${email}...`);
        console.log("Invoice status:", invoice.status);
        
        // Generate PDF using the client-side PDF generator
        console.log("Generating PDF for email attachment...");
        const pdfBase64 = await getInvoiceAsBase64(invoice);
        console.log("PDF generation completed successfully");
        
        // Make sure invoice status is lowercase for consistency
        const normalizedInvoice = {
          ...invoice,
          status: invoice.status ? invoice.status.toLowerCase() : 'draft'
        };
        
        // Send the invoice email with the PDF attachment
        const { data, error } = await supabase.functions.invoke('send-invoice', {
          body: { 
            invoice: normalizedInvoice, 
            email,
            pdfBase64
          }
        });

        if (error) {
          console.error("Supabase function error:", error);
          throw new Error(`Function error: ${error.message}`);
        }
        
        if (!data || data.success === false) {
          console.error("Function returned error:", data?.error || "Unknown error");
          throw new Error(data?.error || "Unknown error sending invoice");
        }
        
        // If function succeeds, update the invoice as sent
        if (data.success && invoice.status === 'draft') {
          const { error: updateError } = await supabase
            .from('invoices')
            .update({
              status: 'sent',
              email_sent: true
            })
            .eq('id', invoice.id);
            
          if (updateError) {
            console.error("Error updating invoice status:", updateError);
            throw updateError;
          }
        }

        return data;
      } catch (error) {
        console.error("Error sending invoice email:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Invoice email sent successfully");
    },
    onError: (error: Error) => {
      console.error("Failed to send invoice email:", error);
      
      // Show a more user-friendly error message
      if (error.message.includes("domain is not verified")) {
        toast.error("Email domain not verified in Resend. Please verify your domain or update the sender email address.");
      } else if (error.message.includes("PDF generation failed")) {
        toast.error("Failed to generate invoice PDF. Please try again later or contact support.");
      } else if (error.message.includes("Email sending failed")) {
        toast.error("Failed to send email. Please check the recipient's email address and that the Resend API is configured.");
      } else if (error.message.includes("RESEND_API_KEY")) {
        toast.error("Missing Resend API Key. Please configure the RESEND_API_KEY in your Supabase project.");
      } else {
        toast.error(`Failed to send invoice: ${error.message}`);
      }
    },
  });
}
