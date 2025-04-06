
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook to mark an invoice as paid
 */
export function useMarkInvoiceAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_received: true,
          payment_date: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;

      return { id: invoiceId };
    },
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      toast.success("Invoice marked as paid");
    },
    onError: (error: Error) => {
      console.error("Error marking invoice as paid:", error);
      toast.error("Failed to update invoice status");
    },
  });
}
