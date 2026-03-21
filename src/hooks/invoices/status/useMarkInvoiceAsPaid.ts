
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateClassConfirmationEmails } from "@/lib/email/generateClassConfirmation";
import { generatePaymentReceiptEmails } from "@/lib/email/generatePaymentReceipt";
import { syncInvoiceToIO, fetchIOPaymentPDF, getIOOfflineModeFromDB } from "../useIOSync";

/**
 * Hook to mark an invoice as paid
 * Also queues a payment receipt and class confirmation email automatically
 * Supports secondary contact - will queue emails to both addresses if secondary exists
 * 
 * IO Workflow:
 * 1. Check if IO offline mode is enabled
 * 2. If online: ensure invoice is synced to IO first (if not already)
 * 3. Sync payment to IO
 * 4. Fetch payment receipt PDF from IO
 * 5. Attach PDF to payment receipt email
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
      
      let paymentPdfBase64: string | undefined;
      
      // Check if IO offline mode is enabled
      const isOfflineMode = await getIOOfflineModeFromDB();
      
      if (!isOfflineMode) {
        // Step 1: Check if invoice is already synced to IO
        const { data: invoice } = await supabase
          .from('invoices')
          .select('io_document_id')
          .eq('id', invoiceId)
          .single();
        
        // Step 2: If not synced, sync invoice first
        if (!invoice?.io_document_id) {
          console.log('[IO Sync] Invoice not synced yet, syncing before payment...');
          const invoiceSyncResult = await syncInvoiceToIO(invoiceId, 'invoice');
          
          if (!invoiceSyncResult.success && !invoiceSyncResult.skipped) {
            console.warn('[IO Sync] Invoice sync failed before payment, continuing with local receipt');
          }
        }
        
        // Step 3: Sync the payment to IO
        console.log('[IO Sync] Syncing payment to IO...');
        const paymentResult = await syncInvoiceToIO(invoiceId, 'payment');
        
        if (paymentResult.success && !paymentResult.skipped) {
          // Step 4: Fetch payment receipt PDF from IO
          console.log('[IO Sync] Fetching payment receipt PDF from IO...');
          const pdfResult = await fetchIOPaymentPDF(invoiceId);
          
          if (pdfResult.success && pdfResult.pdfBase64) {
            paymentPdfBase64 = pdfResult.pdfBase64;
            console.log('[IO Sync] Payment receipt PDF fetched successfully');
          } else {
            console.warn('[IO Sync] Could not fetch payment PDF:', pdfResult.error);
          }
        } else if (!paymentResult.success) {
          console.warn('[IO Sync] Payment sync failed:', paymentResult.error);
        }
      } else {
        console.log('[IO Sync] IO offline mode enabled, skipping IO sync');
      }
      
      let emailsQueued = 0;
      
      // Generate and queue payment receipt emails (including secondary contact)
      // Pass the IO payment PDF if we have it
      try {
        const receiptEmails = await generatePaymentReceiptEmails(invoiceId, paymentPdfBase64);
        
        for (const receiptData of receiptEmails) {
          const { error: receiptError } = await supabase
            .from("email_queue")
            .insert({
              branch_id: receiptData.branch_id,
              to_email: receiptData.to_email,
              subject: receiptData.subject,
              html_content: receiptData.html_content,
              handler_id: receiptData.handler_id,
              status: "review",
              attachments: receiptData.attachments || null,
            });

          if (receiptError) {
            console.warn("Could not queue receipt email:", receiptError);
          } else {
            console.log("Payment receipt email queued for:", receiptData.to_email, 
              receiptData.attachments ? "(with IO PDF attachment)" : "(no attachment)");
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
              status: "review",
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
      
      // Show appropriate toast based on emails queued and PDF attachment
      const hasIOPdf = !!paymentPdfBase64;
      if (emailsQueued > 2) {
        toast.success(`Invoice marked as paid - ${emailsQueued} emails queued for review${hasIOPdf ? ' with IO receipt' : ''}`);
      } else if (emailsQueued === 2) {
        toast.success(`Invoice marked as paid - receipt & confirmation emails queued for review${hasIOPdf ? ' with IO receipt' : ''}`);
      } else if (emailsQueued === 1) {
        toast.success(`Invoice marked as paid - email queued for review${hasIOPdf ? ' with IO receipt' : ''}`);
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
