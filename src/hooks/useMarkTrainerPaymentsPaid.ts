
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMarkTrainerPaymentsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      trainerId, 
      scheduleIds,
      paymentMethod,
      transactionId,
      notes,
      sendEmail = false,
      documentUrl,
      documentName
    }: { 
      trainerId: string; 
      scheduleIds: string[];
      paymentMethod: 'bank_transfer' | 'cash' | 'check' | 'other';
      transactionId?: string;
      notes?: string;
      sendEmail?: boolean;
      documentUrl?: string;
      documentName?: string;
    }) => {
      if (!scheduleIds.length) {
        throw new Error("No schedules selected");
      }
      
      // Current timestamp for all updates
      const now = new Date().toISOString();
      
      console.log("Marking payments as paid:", {
        trainerId,
        scheduleIds,
        paymentMethod,
        transactionId,
        now
      });
      
      // Update trainer payment records for these schedules
      const { data, error } = await supabase
        .from('trainer_payments')
        .update({
          status: 'paid',
          payment_date: now,
          payment_method: paymentMethod,
          transaction_id: transactionId || null,
          notes: notes || null,
          document_url: documentUrl || null,
          document_name: documentName || null,
          updated_at: now
        })
        .eq('trainer_id', trainerId)
        .in('class_schedule_id', scheduleIds);

      console.log("Update response:", { data, error });
      
      if (error) {
        console.error("Error updating trainer payments:", error);
        throw error;
      }
      
      // If email notification is requested, send it via edge function
      if (sendEmail) {
        try {
          const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('send-trainer-payment', {
            body: {
              trainerId,
              scheduleIds,
              paymentMethod,
              transactionId: transactionId || null,
              paymentDate: now,
              documentUrl: documentUrl || null
            }
          });
          
          if (edgeFunctionError) {
            console.error("Error sending payment email:", edgeFunctionError);
            // Don't throw error, just log it - we still want the payment to be recorded
          }
          
          if (edgeFunctionData?.success) {
            toast.success("Payment notification email sent");
          }
        } catch (emailError) {
          console.error("Failed to send payment email:", emailError);
          // Don't throw error, just log it - we still want the payment to be recorded
        }
      }
      
      return { trainerId, scheduleIds };
    },
    onSuccess: () => {
      // Invalidate all related queries to ensure payment history is refreshed
      queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['trainer-payment-history'] });
      toast.success("Payments marked as paid successfully");
    },
    onError: (error) => {
      console.error("Error marking trainer payments as paid:", error);
      toast.error("Failed to update payment status: " + (error as Error).message);
    }
  });
}
