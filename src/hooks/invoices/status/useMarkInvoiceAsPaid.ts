
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
      console.log(`Marking invoice ${invoiceId} as paid`);
      
      // Get current timestamp for payment date
      const paymentDate = new Date().toISOString();
      
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_received: true,
          payment_date: paymentDate
        })
        .eq('id', invoiceId);

      if (error) {
        console.error("Error marking invoice as paid:", error);
        throw error;
      }

      console.log(`Successfully marked invoice ${invoiceId} as paid with payment date ${paymentDate}`);
      return { id: invoiceId };
    },
    onSuccess: (_, invoiceId) => {
      // Invalidate all relevant queries to ensure data is refreshed
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['classes-list-data'] });
      toast.success("Invoice marked as paid");
    },
    onError: (error: Error) => {
      console.error("Error marking invoice as paid:", error);
      toast.error("Failed to update invoice status");
    },
  });
}
