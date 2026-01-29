
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { handleMutationError } from "./useMutationUtils";
import { useNavigate } from "react-router-dom";
import { issueCreditNote } from "../useIOSync";

/**
 * Hook to delete an invoice
 * Issues a credit note in InvoicesOnline first if the invoice was synced there
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (invoiceId: string): Promise<{ id: string; creditNoteIssued: boolean }> => {
      let creditNoteIssued = false;

      // Step 1: Fetch invoice to check IO sync status
      const { data: invoice } = await supabase
        .from('invoices')
        .select('io_document_id, io_sync_status')
        .eq('id', invoiceId)
        .single();

      // Step 2: If synced to IO, issue credit note first
      if (invoice?.io_document_id) {
        console.log('[Delete] Invoice synced to IO, issuing credit note first');
        const creditResult = await issueCreditNote(invoiceId);

        if (!creditResult.success) {
          // Warn but don't block - local deletion should still proceed
          console.warn('[Delete] Credit note failed:', creditResult.error);
          toast.warning('IO credit note could not be issued', {
            description: creditResult.error,
          });
        } else {
          console.log('[Delete] Credit note issued successfully');
          creditNoteIssued = true;
        }
      }

      // Step 3: Proceed with local deletion
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      return { id: invoiceId, creditNoteIssued };
    },
    onSuccess: (result, invoiceId) => {
      // Properly invalidate all related queries to ensure UI is updated correctly
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      
      toast.success("Invoice deleted successfully", {
        description: result.creditNoteIssued 
          ? "Credit note issued in InvoicesOnline" 
          : undefined
      });
      
      // Navigate to the invoices list page
      navigate('/invoices');
    },
    onError: (error: Error) => {
      handleMutationError(error, "Failed to delete invoice");
    },
  });
}
