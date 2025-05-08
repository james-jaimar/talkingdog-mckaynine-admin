
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cleanupTrainerPayments } from "@/hooks/trainer-payments/utils/cleanupTrainerPayments";

/**
 * Hook to mark an invoice as sent with improved error handling
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
      
      try {
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

        // If the update succeeded, try to fix any duplicate trainer payments
        // that might have been created (silent operation, won't block success)
        try {
          const { error: fixError } = await supabase.rpc('fix_duplicate_trainer_payments');
          if (fixError) {
            console.warn("Non-critical: Could not fix duplicate trainer payments:", fixError);
          }
        } catch (fixErr) {
          // Non-critical, just log warning
          console.warn("Failed to run cleanup for trainer payments:", fixErr);
        }

        return { id: invoiceId, client_id: data?.client_id };
      } catch (error) {
        console.error("Error in invoice update:", error);
        throw error;
      }
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
      
      // Also update trainer payments to ensure no duplicates
      queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
      
      toast.success("Invoice marked as sent");
    },
    onError: (error: Error) => {
      console.error("Error marking invoice as sent:", error);
      
      // Check if this is a duplicate key violation
      if (error.message && error.message.includes("duplicate key")) {
        toast.error("Failed to update invoice - detected a duplicate trainer payment. Please refresh and try again.");
      } else {
        toast.error("Failed to update invoice status");
      }
      
      // Try to recover by running the fix duplicates function
      (async () => {
        try {
          await supabase.rpc('fix_duplicate_trainer_payments');
          console.log("Attempted recovery by fixing duplicate trainer payments");
        } catch (err) {
          console.error("Failed to run recovery function:", err);
        }
      })();
      
      // Also try to use the utility function for a more thorough cleanup
      // Using an immediately invoked async function with try/catch instead of .catch()
      (async () => {
        try {
          await cleanupTrainerPayments();
        } catch (err) {
          console.error("Failed to run cleanupTrainerPayments:", err);
        }
      })();
    },
  });
}
