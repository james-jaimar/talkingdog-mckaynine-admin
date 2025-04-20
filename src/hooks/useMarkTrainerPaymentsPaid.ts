
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMarkTrainerPaymentsPaid() {
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
      
      const now = new Date().toISOString();
      
      // Create trainer payment records for these schedules
      const { data, error } = await supabase
        .from('trainer_payments')
        .insert(
          scheduleIds.map(scheduleId => ({
            trainer_id: trainerId,
            class_schedule_id: scheduleId,
            amount: 0, // We'll update this later based on invoice calculations
            status: 'paid',
            payment_date: now,
            created_at: now,
            updated_at: now
          }))
        )
        .select();

      if (error) throw error;
      
      return { trainerId, scheduleIds };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
      toast.success("Trainer payments marked as paid");
    },
    onError: (error) => {
      console.error("Error marking trainer payments as paid:", error);
      toast.error("Failed to update payment status");
    }
  });
}
