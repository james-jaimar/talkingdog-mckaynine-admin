
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { handleMutationError } from "./useMutationUtils";
import { useNavigate } from "react-router-dom";

/**
 * Hook to delete an invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      return { id: invoiceId };
    },
    onSuccess: (_, invoiceId) => {
      // Properly invalidate all related queries to ensure UI is updated correctly
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      
      toast.success("Invoice deleted successfully");
      
      // Navigate to the invoices list page
      navigate('/invoices');
    },
    onError: (error: Error) => {
      handleMutationError(error, "Failed to delete invoice");
    },
  });
}
