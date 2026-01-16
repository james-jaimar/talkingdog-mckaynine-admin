
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateClassConfirmationEmails } from "@/lib/email/generateClassConfirmation";
import { generatePaymentReceiptEmails } from "@/lib/email/generatePaymentReceipt";

/**
 * Hook to mark an invoice as paid
 * Also queues a payment receipt and class confirmation email automatically
 * Supports secondary contact - will queue emails to both addresses if secondary exists
 */
export function useMarkInvoiceAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      console.log(`Marking invoice ${invoiceId} as paid`);
      
      // Get current timestamp for payment date
      const paymentDate = new Date().toISOString();
      
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_received: true,
          payment_date: paymentDate
        })
        .eq('id', invoiceId);

      if (error) {
        console.error("Error marking invoice as paid:", error);
        throw error;
      }

      console.log(`Successfully marked invoice ${invoiceId} as paid with payment date ${paymentDate}`);
      return { id: invoiceId };
    },
    onSuccess: async (_, invoiceId) => {
      // Invalidate all relevant queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['classes-list-data'] });
      
      let emailsQueued = 0;
      
      // Generate and queue payment receipt emails (including secondary contact)
      try {
        const receiptEmails = await generatePaymentReceiptEmails(invoiceId);
        
        for (const receiptData of receiptEmails) {
          const { error: receiptError } = await supabase
            .from("email_queue")
            .insert({
              branch_id: receiptData.branch_id,
              to_email: receiptData.to_email,
              subject: receiptData.subject,
              html_content: receiptData.html_content,
              handler_id: receiptData.handler_id,
              status: "pending",
            });

          if (receiptError) {
            console.warn("Could not queue receipt email:", receiptError);
          } else {
            console.log("Payment receipt email queued for:", receiptData.to_email);
            emailsQueued++;
          }
        }
      } catch (receiptError) {
        console.warn("Error queueing receipt emails:", receiptError);
      }
      
      // Generate and queue class confirmation emails (including secondary contact)
      try {
        const confirmationEmails = await generateClassConfirmationEmails(invoiceId);
        
        for (const confirmationData of confirmationEmails) {
          const { error: confirmationError } = await supabase
            .from("email_queue")
            .insert({
              branch_id: confirmationData.branch_id,
              to_email: confirmationData.to_email,
              subject: confirmationData.subject,
              html_content: confirmationData.html_content,
              handler_id: confirmationData.handler_id,
              status: "pending",
            });

          if (confirmationError) {
            console.warn("Could not queue confirmation email:", confirmationError);
          } else {
            console.log("Class confirmation email queued for:", confirmationData.to_email);
            emailsQueued++;
          }
        }
      } catch (emailError) {
        console.warn("Error queueing confirmation emails:", emailError);
      }
      
      // Show appropriate toast based on emails queued
      if (emailsQueued > 2) {
        toast.success(`Invoice marked as paid - ${emailsQueued} emails queued (including secondary contact)`);
      } else if (emailsQueued === 2) {
        toast.success("Invoice marked as paid - receipt & confirmation emails queued");
      } else if (emailsQueued === 1) {
        toast.success("Invoice marked as paid - email queued");
      } else {
        toast.success("Invoice marked as paid");
      }
    },
    onError: (error: Error) => {
      console.error("Error marking invoice as paid:", error);
      toast.error("Failed to update invoice status");
    },
  });
}
