
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook to mark an invoice as sent
 */
export function useMarkInvoiceAsSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'sent',
          email_sent: true
        })
        .eq('id', invoiceId);

      if (error) throw error;

      return { id: invoiceId };
    },
    onSuccess: (_, invoiceId) => {
      // Invalidate all invoice queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['client-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
      
      toast.success("Invoice marked as sent");
    },
    onError: (error: Error) => {
      console.error("Error marking invoice as sent:", error);
      toast.error("Failed to update invoice status");
    },
  });
}
