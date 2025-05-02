
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
      
      try {
        // Check if trainer payments exist for these schedules
        const { data: existingPayments, error: checkError } = await supabase
          .from('trainer_payments')
          .select('id, status')
          .eq('trainer_id', trainerId)
          .in('class_schedule_id', scheduleIds);
          
        if (checkError) {
          console.error("Error checking trainer payments:", checkError);
          throw checkError;
        }
        
        console.log(`Found ${existingPayments?.length || 0} existing payments to update`);
        
        if (!existingPayments?.length) {
          toast.warning("No payment records found to update");
          return { trainerId, scheduleIds, updatedCount: 0 };
        }
        
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
          // If error mentions column doesn't exist, handle gracefully
          if (error.message && (
            error.message.includes("column") && 
            error.message.includes("does not exist")
          )) {
            console.warn("Column compatibility issue:", error.message);
            
            // Use a more basic update that should work on all DB versions
            const { data: retryData, error: retryError } = await supabase
              .from('trainer_payments')
              .update({
                status: 'pending',
                payment_date: null,
                updated_at: new Date().toISOString()
              })
              .eq('trainer_id', trainerId)
              .in('class_schedule_id', scheduleIds);
              
            console.log("Retry update response:", { data: retryData, error: retryError });
            
            if (retryError) {
              throw retryError;
            }
          } else {
            throw error;
          }
        }
        
        return { 
          trainerId, 
          scheduleIds, 
          updatedCount: existingPayments.length 
        };
      } catch (error) {
        console.error("Error in markTrainerPaymentsUnpaid:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      // Force refresh with a small delay to ensure DB has updated
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
        queryClient.invalidateQueries({ queryKey: ['trainer-payment-history'] });
      }, 500);
      toast.success(`${result.updatedCount || 'All'} payments marked as unpaid successfully`);
    },
    onError: (error) => {
      console.error("Error marking trainer payments as unpaid:", error);
      toast.error("Failed to update payment status: " + (error as Error).message);
    }
  });
}
