
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Invoice } from "../invoices/types";

export function useEmailInvoice() {
  return useMutation({
    mutationFn: async ({ invoice, email }: { invoice: Invoice; email: string }) => {
      try {
        console.log(`Sending invoice ${invoice.invoice_number} to ${email}...`);
        
        const { data, error } = await supabase.functions.invoke('send-invoice', {
          body: { invoice, email }
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
      if (error.message.includes("PDF generation failed")) {
        toast.error("Failed to generate invoice PDF. Please try again later or contact support.");
      } else if (error.message.includes("Email sending failed")) {
        toast.error("Failed to send email. Please check the recipient's email address or try again later.");
      } else {
        toast.error(`Failed to send invoice: ${error.message}`);
      }
    },
  });
}
