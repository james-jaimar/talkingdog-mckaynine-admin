import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { handleMutationError } from "./useMutationUtils";
import { useNavigate } from "react-router-dom";
import { issueCreditNote, reversePaidInvoice } from "../useIOSync";

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

      // Step 2: If synced to IO, handle reversal based on payment status
      if (invoice?.io_document_id) {
        // Check if invoice was PAID - needs both payout and credit note
        const isPaid = invoice.status === 'paid' || invoice.payment_received === true;
        
        if (isPaid) {
          console.log('[Delete] Invoice was paid and synced to IO, issuing payout + credit note...');
          const result = await reversePaidInvoice(invoiceId);

          if (!result.success) {
            console.warn('[Delete] Reverse failed:', result.error);
            toast.warning('IO reversal could not be completed', {
              description: result.error,
            });
            ioActionTaken = 'failed';
          } else {
            console.log('[Delete] Payout + Credit Note issued successfully');
            ioActionTaken = 'reversed';
          }
        } else {
          // Not paid - just issue credit note
          console.log('[Delete] Invoice synced to IO (not paid), issuing credit note only...');
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

      // Step 3: Proceed with local deletion
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      return { id: invoiceId, ioActionTaken };
    },
    onSuccess: (result, invoiceId) => {
      // Properly invalidate all related queries to ensure UI is updated correctly
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      
      const description = result.ioActionTaken === 'reversed' 
        ? "Payout + Credit Note issued in InvoicesOnline" 
        : result.ioActionTaken === 'credit_note'
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
