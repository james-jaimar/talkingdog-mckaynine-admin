
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
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('trainer_payments')
        .update({
          status: 'paid',
          payment_date: now,
          updated_at: now
        })
        .eq('trainer_id', trainerId)
        .in('class_schedule_id', scheduleIds)
        .eq('status', 'pending');

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
