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
      console.log(`Marking invoice ${invoiceId} as sent`);
      
      // First, get the current invoice data to preserve discount values
      const { data: currentInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching invoice data:", fetchError);
        throw fetchError;
      }
      
      // Preserve the original discount values
      const { 
        discount_amount, 
        discount_type, 
        monetary_discount, 
        original_discount_amount,
        original_discount_type,
        discount_reason
      } = currentInvoice;
      
      // Update only the status without changing discount values
      const { error, data } = await supabase
        .from('invoices')
        .update({
          status: 'sent',
          email_sent: true,
          // Ensure we keep the original discount values
          discount_amount,
          discount_type,
          monetary_discount,
          original_discount_amount,
          original_discount_type,
          discount_reason
        })
        .eq('id', invoiceId)
        .select('client_id')
        .single();

      if (error) {
        console.error("Error marking invoice as sent:", error);
        throw error;
      }

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
