
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMarkTrainerPaymentsUnpaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      trainerId, 
      scheduleIds 
    }: { 
      trainerId: string; 
      scheduleIds: string[];
    }) => {
      if (!scheduleIds.length) {
        throw new Error("No schedules selected");
      }
      
      console.log("Marking trainer payments as unpaid:", {
        trainerId,
        scheduleIds
      });
      
      // Update trainer payment records for these schedules back to pending
      const { data, error } = await supabase
        .from('trainer_payments')
        .update({
          status: 'pending',
          payment_date: null,
          payment_method: null,
          transaction_id: null,
          notes: null,
          updated_at: new Date().toISOString()
        })
        .eq('trainer_id', trainerId)
        .in('class_schedule_id', scheduleIds);

      console.log("Update response:", { data, error });
      
      if (error) {
        console.error("Error updating trainer payments to unpaid:", error);
        throw error;
      }
      
      return { trainerId, scheduleIds };
    },
    onSuccess: () => {
      // Invalidate both trainer-payments and trainer-payment-history queries
      queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['trainer-payment-history'] });
      toast.success("Payments marked as unpaid successfully");
    },
    onError: (error) => {
      console.error("Error marking trainer payments as unpaid:", error);
      toast.error("Failed to update payment status: " + (error as Error).message);
    }
  });
}
