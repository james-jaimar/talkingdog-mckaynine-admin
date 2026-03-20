
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "./types";
import { fetchIOPDF, syncInvoiceToIO, getIOOfflineModeFromDB } from "./useIOSync";
import { toast } from "sonner";
import { generateInvoiceEmailHtml, generateInvoiceEmailSubject } from "@/lib/email/generateInvoiceEmail";

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
        
        let pdfBase64: string | undefined;
        
        // Check if IO offline mode is enabled
        const isOfflineMode = await getIOOfflineModeFromDB();
        
        if (!isOfflineMode) {
          // Step 1: Check if invoice is synced to IO
          const { data: invoiceData } = await supabase
            .from('invoices')
            .select('io_document_id, branch_id, client:clients(id)')
            .eq('id', invoice.id)
            .single();
          
          // Step 2: If invoice not synced, sync it first
          if (!invoiceData?.io_document_id) {
            toast.info("Syncing invoice to InvoicesOnline...");
            const syncResult = await syncInvoiceToIO(invoice.id, 'invoice');
            
            if (!syncResult.success && !syncResult.skipped) {
              console.warn('[Email Invoice] Invoice sync failed:', syncResult.error);
              // Continue without IO - we'll still queue the email without attachment
            }
          }
          
          // Step 3: Fetch IO invoice PDF
          toast.info("Fetching invoice PDF from InvoicesOnline...");
          const pdfResult = await fetchIOPDF(invoice.id);
          
          if (pdfResult.success && pdfResult.pdfBase64) {
            pdfBase64 = pdfResult.pdfBase64;
            console.log('[Email Invoice] IO invoice PDF fetched successfully');
          } else {
            console.warn('[Email Invoice] Could not fetch IO invoice PDF:', pdfResult.error);
          }
        } else {
          console.log('[Email Invoice] IO offline mode - skipping PDF fetch');
        }
        
        // Generate email content
        const subject = customSubject || generateInvoiceEmailSubject(invoice);
        const htmlContent = customEmailHtml || await generateInvoiceEmailHtml(invoice);
        
        // Get branch_id from invoice
        const { data: invoiceDetails } = await supabase
          .from('invoices')
          .select('branch_id, client_id')
          .eq('id', invoice.id)
          .single();
        
        if (!invoiceDetails?.branch_id) {
          throw new Error("Invoice does not have a branch assigned");
        }
        
        // Build attachments array if we have a PDF
        const attachments = pdfBase64 ? [{
          filename: `invoice-${invoice.invoice_number}.pdf`,
          content: pdfBase64,
          encoding: "base64",
          contentType: "application/pdf"
        }] : [];
        
        // Collect all recipients: the primary email + any additional household recipients
        const allRecipients: Array<{ email: string; handlerId: string | null }> = [
          { email, handlerId: invoiceDetails.client_id }
        ];
        
        // Check for additional recipients (household members)
        const { data: additionalRecipients } = await supabase
          .from('invoice_additional_recipients')
          .select('client_id, clients:client_id(email)')
          .eq('invoice_id', invoice.id);
        
        if (additionalRecipients) {
          for (const recipient of additionalRecipients) {
            const recipientEmail = (recipient as any).clients?.email;
            if (recipientEmail && recipientEmail !== email) {
              allRecipients.push({ email: recipientEmail, handlerId: recipient.client_id });
            }
          }
        }
        
        // Queue an email for each recipient
        for (const recipient of allRecipients) {
          const { error: queueError } = await supabase
            .from("email_queue")
            .insert({
              branch_id: invoiceDetails.branch_id,
              to_email: recipient.email,
              subject: subject,
              html_content: htmlContent,
              handler_id: recipient.handlerId,
              status: "review",
              attachments: attachments.length > 0 ? attachments : null,
            });

          if (queueError) {
            console.error(`Error queueing invoice email for ${recipient.email}:`, queueError);
            throw new Error(`Failed to queue email for ${recipient.email}: ${queueError.message}`);
          }
          
          console.log(`Invoice email queued for: ${recipient.email}`);
        }
        
        return { success: true, queued: true, recipientCount: allRecipients.length };
      } catch (error) {
        console.error("Error in useEmailInvoice:", error);
        throw error;
      }
    },
    onSuccess: (result, variables) => {
      const count = result?.recipientCount || 1;
      const recipientText = count > 1 ? ` (${count} recipients)` : '';
      console.log(`Invoice email queued for ${variables.email}${recipientText}`);
      toast.success(`Invoice ${variables.invoice.invoice_number} queued for ${variables.email}${recipientText}`);
      
      // Invalidate relevant queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoice.id] });
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      
      // If we have the client_id, invalidate client-specific queries
      if (variables.invoice.client_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['client-invoices', variables.invoice.client_id] 
        });
      }
    },
    onError: (error: Error) => {
      console.error("Email queueing error:", error);
      toast.error(`Failed to queue email: ${error.message}`);
    },
  });
}
