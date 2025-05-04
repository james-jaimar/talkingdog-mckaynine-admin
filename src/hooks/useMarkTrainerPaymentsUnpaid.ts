
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMarkTrainerPaymentsUnpaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      trainerId, 
      scheduleIds,
      resetZeroAmounts = false
    }: { 
      trainerId: string; 
      scheduleIds: string[];
      resetZeroAmounts?: boolean;
    }) => {
      // If no scheduleIds provided, check if trainer has any payments to mark as unpaid
      if (!scheduleIds.length) {
        console.log("No schedules explicitly selected, checking for paid schedules for trainer:", trainerId);
        
        // Get all paid schedules for this trainer
        const { data: paidSchedules, error: findError } = await supabase
          .from('trainer_payments')
          .select('class_schedule_id')
          .eq('trainer_id', trainerId)
          .eq('status', 'paid');
          
        if (findError) {
          console.error("Error finding paid trainer schedules:", findError);
          throw findError;
        }
        
        if (paidSchedules && paidSchedules.length > 0) {
          // Use these schedules instead
          scheduleIds = paidSchedules.map(s => s.class_schedule_id);
          console.log(`Found ${scheduleIds.length} paid schedules for trainer ${trainerId}`);
        } else {
          throw new Error("No paid schedules found for this trainer");
        }
      }
      
      console.log("Marking trainer payments as unpaid:", {
        trainerId,
        scheduleIds,
        resetZeroAmounts
      });
      
      try {
        // Check if trainer payments exist for these schedules
        const { data: existingPayments, error: checkError } = await supabase
          .from('trainer_payments')
          .select('id, status, class_schedule_id, amount, booking_id')
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
        
        // Handle zero amount payments that need to be recalculated
        if (resetZeroAmounts) {
          // First, get zero amount records
          const zeroAmountRecords = existingPayments.filter(p => 
            (p.amount === 0 || p.amount === 0.0)
          );
          
          if (zeroAmountRecords.length > 0) {
            console.log(`Found ${zeroAmountRecords.length} records with zero amounts`);
            
            // Get schedule IDs for the zero amount records
            const zeroAmountScheduleIds = zeroAmountRecords.map(p => p.class_schedule_id);
            
            // Get class schedule details to check which ones have zero commission
            const { data: scheduleData, error: scheduleError } = await supabase
              .from('class_schedules')
              .select(`
                id, 
                classes:class_id (
                  trainer_fee_type, 
                  trainer_fee_value
                )
              `)
              .in('id', zeroAmountScheduleIds);
              
            if (scheduleError) {
              console.error("Error fetching class schedules:", scheduleError);
              throw scheduleError;
            }
            
            // Filter out schedules with intentional zero commission
            const schedulesToProcess = scheduleData?.filter(schedule => {
              // Skip schedules that have intentional zero commission
              const hasZeroCommission = 
                schedule.classes && 
                ((schedule.classes.trainer_fee_type === 'fixed' && schedule.classes.trainer_fee_value === 0) ||
                 (schedule.classes.trainer_fee_type === 'percentage' && schedule.classes.trainer_fee_value === 0));
                
              // Log each schedule's commission status
              console.log(`Schedule ${schedule.id}: hasZeroCommission=${hasZeroCommission}, type=${schedule.classes?.trainer_fee_type}, value=${schedule.classes?.trainer_fee_value}`);
              
              // Return false for zero commission schedules (to exclude them)
              return !hasZeroCommission;
            }) || [];
            
            const schedulesToProcessIds = schedulesToProcess.map(s => s.id);
            console.log(`Processing ${schedulesToProcessIds.length} schedules that don't have zero commission`);
            
            // Process only records that don't have intentional zero commission
            for (const record of zeroAmountRecords) {
              // Skip if this schedule has intentional zero commission
              if (!schedulesToProcessIds.includes(record.class_schedule_id)) {
                console.log(`Skipping record for schedule ${record.class_schedule_id} as it has intentional zero commission`);
                continue;
              }
              
              // Skip if no booking ID (can't recalculate)
              if (!record.booking_id) {
                console.log(`Skipping record ${record.id} - no booking ID`);
                continue;
              }
              
              try {
                // Call database function to calculate the correct amount
                const { data: calculatedAmount, error: calcError } = await supabase
                  .rpc('calculate_trainer_payment', { p_booking_id: record.booking_id });
                
                if (calcError) {
                  console.error("Error calculating trainer payment:", calcError);
                  continue;
                }
                
                console.log(`Calculated amount for record ${record.id}: ${calculatedAmount}`);
                
                // Only update if we got a valid calculated amount
                if (calculatedAmount !== null && calculatedAmount !== undefined) {
                  console.log(`Updating record ${record.id} amount from ${record.amount} to ${calculatedAmount}`);
                  
                  // Update the record with the correct amount
                  const { error: updateError } = await supabase
                    .from('trainer_payments')
                    .update({ 
                      amount: calculatedAmount,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', record.id);
                    
                  if (updateError) {
                    console.error("Error updating payment amount:", updateError);
                  }
                }
              } catch (err) {
                console.error("Error in payment recalculation:", err);
              }
            }
          }
        }
        
        // Get the IDs of records that need updating (only paid ones)
        const paidRecordIds = existingPayments
          .filter(p => p.status === 'paid')
          .map(p => p.id);
          
        if (paidRecordIds.length === 0) {
          toast.info("No paid records found to mark as unpaid");
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
          .in('id', paidRecordIds);

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
              .in('id', paidRecordIds);
              
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
          updatedCount: paidRecordIds.length,
          zeroAmountsFixed: resetZeroAmounts
        };
      } catch (error) {
        console.error("Error in markTrainerPaymentsUnpaid:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      // Force refresh with a small delay to ensure DB has updated
      setTimeout(() => {
        // Invalidate all relevant queries to ensure data is refreshed completely
        queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
        queryClient.invalidateQueries({ queryKey: ['trainer-payment-history'] });
        queryClient.invalidateQueries({ queryKey: ['classes-list-data'] });
        
        // For more immediate UI refresh, invalidate with exact parameters if available
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            return query.queryKey[0] === 'trainer-payments' || 
                   query.queryKey[0] === 'trainer-payment-history';
          }
        });
      }, 500);
      
      const successMessage = result.zeroAmountsFixed 
        ? `${result.updatedCount || 'All'} payments updated and zero amounts fixed`
        : `${result.updatedCount || 'All'} payments marked as unpaid successfully`;
        
      toast.success(successMessage);
    },
    onError: (error) => {
      console.error("Error marking trainer payments as unpaid:", error);
      toast.error("Failed to update payment status: " + (error as Error).message);
    }
  });
}
