
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook to cancel an invoice
 */
export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      try {
        const { error } = await supabase
          .from('invoices')
          .update({ status: 'cancelled' })
          .eq('id', invoiceId);

        if (error) throw error;

        return { id: invoiceId };
      } catch (error) {
        console.error("Error in cancel invoice mutation:", error);
        throw error;
      }
    },
    onSuccess: (_, invoiceId) => {
      // Invalidate all relevant queries to update UI
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      
      // Also invalidate booking-invoice queries to update payment status badges
      queryClient.invalidateQueries({ queryKey: ['booking-invoice'] });
      
      toast.success("Invoice cancelled");
    },
    onError: (error: Error) => {
      console.error("Error cancelling invoice:", error);
      toast.error("Failed to cancel invoice");
    },
    meta: {
      // Add onSettled to ensure UI is always released, even on error
      onSettled: () => {
        console.log("Cancel invoice operation completed");
        // Ensure any UI locks are released
        setTimeout(() => {
          document.body.style.pointerEvents = '';
        }, 100);
      }
    }
  });
}
