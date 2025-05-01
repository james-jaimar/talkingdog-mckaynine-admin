
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
      
      // Update trainer payment records for these schedules back to pending
      const { error } = await supabase
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

      if (error) throw error;
      
      return { trainerId, scheduleIds };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
      toast.success("Payments marked as unpaid successfully");
    },
    onError: (error) => {
      console.error("Error marking trainer payments as unpaid:", error);
      toast.error("Failed to update payment status");
    }
  });
}
