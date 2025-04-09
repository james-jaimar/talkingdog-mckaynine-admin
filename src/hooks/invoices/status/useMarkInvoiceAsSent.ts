
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
      const { error, data } = await supabase
        .from('invoices')
        .update({
          status: 'sent',
          email_sent: true
        })
        .eq('id', invoiceId)
        .select('client_id')
        .single();

      if (error) throw error;

      return { id: invoiceId, client_id: data?.client_id };
    },
    onSuccess: (data) => {
      // Invalidate all invoice queries to ensure UI updates with refetch
      queryClient.invalidateQueries({ queryKey: ['invoices'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id], refetchType: 'all' });
      
      // If we have the client_id, invalidate client-specific queries
      if (data.client_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['client-invoices', data.client_id], 
          refetchType: 'all' 
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['my-invoices'], refetchType: 'all' });
      
      // Force refetch the invoices list
      queryClient.refetchQueries({ queryKey: ['invoices'] });
      
      toast.success("Invoice marked as sent");
    },
    onError: (error: Error) => {
      console.error("Error marking invoice as sent:", error);
      toast.error("Failed to update invoice status");
    },
  });
}
