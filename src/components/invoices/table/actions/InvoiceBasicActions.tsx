import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Eye, Edit, Send, Receipt, Mail } from "lucide-react";
import { Invoice } from "@/types/invoice";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { generateClassConfirmationEmails } from "@/lib/email/generateClassConfirmation";
import { generatePaymentReceiptEmails } from "@/lib/email/generatePaymentReceipt";
import { fetchIOPaymentPDF, getIOOfflineModeFromDB, syncInvoiceToIO } from "@/hooks/invoices/useIOSync";
import { toast } from "sonner";

interface InvoiceBasicActionsProps {
  invoice: Invoice;
  isPending: boolean;
  onCloseDropdown: () => void;
  onEmailInvoice: (invoice: Invoice) => void;
}

export function InvoiceBasicActions({ 
  invoice, 
  isPending, 
  onCloseDropdown,
  onEmailInvoice 
}: InvoiceBasicActionsProps) {
  const navigate = useNavigate();
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingReceipt, setIsSendingReceipt] = useState(false);

  const handleView = () => {
    onCloseDropdown();
    console.log("Viewing invoice with ID:", invoice.id);
    navigate(`/invoices/${invoice.id}`);
  };

  const handleEdit = () => {
    onCloseDropdown();
    navigate(`/invoices/${invoice.id}/edit`);
  };

  const handleSendClassConfirmation = async () => {
    onCloseDropdown();
    setIsSendingEmail(true);
    
    try {
      toast.info("Generating class confirmation email(s)...");
      
      const emailsData = await generateClassConfirmationEmails(invoice.id);
      
      if (emailsData.length === 0) {
        toast.warning("No class bookings found on this invoice to send confirmation for");
        return;
      }
      
      let queued = 0;
      for (const emailData of emailsData) {
        const { error: queueError } = await supabase
          .from("email_queue")
          .insert({
            branch_id: emailData.branch_id,
            to_email: emailData.to_email,
            subject: emailData.subject,
            html_content: emailData.html_content,
            handler_id: emailData.handler_id,
            status: "pending",
          });

        if (queueError) {
          console.error("Error queueing confirmation email:", queueError);
        } else {
          console.log("Class confirmation email queued for:", emailData.to_email);
          queued++;
        }
      }
      
      if (queued > 1) {
        toast.success(`Class confirmation emails queued for ${queued} recipients`);
      } else if (queued === 1) {
        toast.success(`Class confirmation email queued for ${emailsData[0].to_email}`);
      } else {
        toast.error("Failed to queue confirmation emails");
      }
    } catch (error) {
      console.error("Error sending class confirmation:", error);
      toast.error("Failed to send class confirmation email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendPaymentReceipt = async () => {
    onCloseDropdown();
    setIsSendingReceipt(true);
    
    try {
      toast.info("Preparing payment receipt...");
      
      let paymentPdfBase64: string | undefined;
      
      // Check if IO offline mode is enabled
      const isOfflineMode = await getIOOfflineModeFromDB();
      
      if (!isOfflineMode) {
        // Step 1: Check current IO sync status
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('io_document_id, io_payment_url')
          .eq('id', invoice.id)
          .single();
        
        // Step 2: If invoice not synced to IO, sync it first
        if (!invoiceData?.io_document_id) {
          toast.info("Syncing invoice to InvoicesOnline...");
          const invoiceSyncResult = await syncInvoiceToIO(invoice.id, 'invoice');
          
          if (!invoiceSyncResult.success && !invoiceSyncResult.skipped) {
            console.warn('[Send Receipt] Invoice sync failed:', invoiceSyncResult.error);
            // Continue - email will still send, just without IO attachment
          }
        }
        
        // Step 3: If payment not synced to IO, sync it first
        if (!invoiceData?.io_payment_url) {
          toast.info("Syncing payment to InvoicesOnline...");
          const paymentSyncResult = await syncInvoiceToIO(invoice.id, 'payment');
          
          if (!paymentSyncResult.success && !paymentSyncResult.skipped) {
            console.warn('[Send Receipt] Payment sync failed:', paymentSyncResult.error);
            // Continue - email will still send, just without IO attachment
          }
        }
        
        // Step 4: Fetch IO payment PDF
        toast.info("Fetching receipt from InvoicesOnline...");
        const pdfResult = await fetchIOPaymentPDF(invoice.id);
        
        if (pdfResult.success && pdfResult.pdfBase64) {
          paymentPdfBase64 = pdfResult.pdfBase64;
          console.log('[Send Receipt] IO payment PDF fetched successfully');
        } else {
          console.warn('[Send Receipt] Could not fetch IO payment PDF:', pdfResult.error);
          // Continue without PDF - the email template still works
        }
      } else {
        console.log('[Send Receipt] IO offline mode - skipping PDF fetch');
      }
      
      toast.info("Generating payment receipt(s)...");
      
      // Pass the IO PDF to the email generator
      const receiptsData = await generatePaymentReceiptEmails(invoice.id, paymentPdfBase64);
      
      if (receiptsData.length === 0) {
        toast.warning("Could not generate payment receipt for this invoice");
        return;
      }
      
      let queued = 0;
      for (const receiptData of receiptsData) {
        const { error: queueError } = await supabase
          .from("email_queue")
          .insert({
            branch_id: receiptData.branch_id,
            to_email: receiptData.to_email,
            subject: receiptData.subject,
            html_content: receiptData.html_content,
            handler_id: receiptData.handler_id,
            status: "pending",
            attachments: receiptData.attachments || null,
          });

        if (queueError) {
          console.error("Error queueing receipt email:", queueError);
        } else {
          console.log("Payment receipt email queued for:", receiptData.to_email);
          queued++;
        }
      }
      
      if (queued > 1) {
        toast.success(`Payment receipts queued for ${queued} recipients`);
      } else if (queued === 1) {
        toast.success(`Payment receipt queued for ${receiptsData[0].to_email}`);
      } else {
        toast.error("Failed to queue payment receipts");
      }
    } catch (error) {
      console.error("Error sending payment receipt:", error);
      toast.error("Failed to send payment receipt");
    } finally {
      setIsSendingReceipt(false);
    }
  };

  const handleEmailInvoice = () => {
    // CRITICAL: Notify parent FIRST, before closing dropdown
    // This ensures parent captures invoice state before unmounting begins
    onEmailInvoice(invoice);
    // Close dropdown after parent has captured the invoice
    onCloseDropdown();
  };

  return (
    <>
      <DropdownMenuItem onClick={handleView} disabled={isPending}>
        <Eye className="mr-2 h-4 w-4" /> View
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleEdit} disabled={isPending || invoice.status === 'paid'}>
        <Edit className="mr-2 h-4 w-4" /> Edit
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={handleSendClassConfirmation} 
        disabled={isPending || isSendingEmail}
      >
        <Send className="mr-2 h-4 w-4 text-blue-600" /> Send Class Confirmation
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={handleSendPaymentReceipt} 
        disabled={isPending || isSendingReceipt}
      >
        <Receipt className="mr-2 h-4 w-4 text-green-600" /> Send Payment Receipt
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={handleEmailInvoice} 
        disabled={isPending}
      >
        <Mail className="mr-2 h-4 w-4 text-purple-600" /> Email Invoice
      </DropdownMenuItem>
    </>
  );
}
