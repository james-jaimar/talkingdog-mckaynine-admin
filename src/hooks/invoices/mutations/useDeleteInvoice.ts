import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { handleMutationError } from "./useMutationUtils";
import { useNavigate } from "react-router-dom";
import { issueCreditNote } from "../useIOSync";

/**
 * Hook to delete an invoice
 * For paid invoices synced to IO: Issues a Payout + Credit Note to bring balance to zero
 * For unpaid invoices synced to IO: Issues just a Credit Note
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (invoiceId: string): Promise<{ id: string; ioActionTaken: string }> => {
      let ioActionTaken = 'none';

      // Step 1: Fetch invoice to check IO sync status and payment status
      const { data: invoice } = await supabase
        .from('invoices')
        .select('io_document_id, io_sync_status, status, payment_received')
        .eq('id', invoiceId)
        .single();

      // Step 2: If synced to IO, handle based on payment status
      if (invoice?.io_document_id) {
        const isPaid = invoice.status === 'paid' || invoice.payment_received === true;
        
        if (isPaid) {
          // SIMPLIFIED: Don't try to reverse in IO - their accounting is broken
          // IO is only used for PDF generation, not accounting
          console.log('[Delete] Paid invoice synced to IO - skipping IO reversal (not used for accounting)');
          ioActionTaken = 'skipped';
        } else {
          // Not paid - issue credit note to cancel the invoice in IO
          console.log('[Delete] Invoice synced to IO (not paid), issuing credit note...');
          const creditResult = await issueCreditNote(invoiceId);

          if (!creditResult.success) {
            console.warn('[Delete] Credit note failed:', creditResult.error);
            toast.warning('IO credit note could not be issued', {
              description: creditResult.error,
            });
            ioActionTaken = 'failed';
          } else {
            console.log('[Delete] Credit note issued successfully');
            ioActionTaken = 'credit_note';
          }
        }
      }

      // Step 3: Proceed with local deletion (also returns any starter kits to inventory)
      const { error } = await supabase.rpc('delete_invoice_cascade', {
        p_invoice_id: invoiceId,
      });

      if (error) throw error;

      return { id: invoiceId, ioActionTaken };
    },
    onSuccess: (result, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['starter-kit-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['starter-kit-allocations'] });
      
      // Only mention IO action for credit notes (unpaid invoices)
      const description = result.ioActionTaken === 'credit_note'
        ? "Credit note issued in InvoicesOnline"
        : undefined;
      
      toast.success("Invoice deleted successfully", { description });
      
      // Navigate to the invoices list page
      navigate('/invoices');
    },
    onError: (error: Error) => {
      handleMutationError(error, "Failed to delete invoice");
    },
  });
}
