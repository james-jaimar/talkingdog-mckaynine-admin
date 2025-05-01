
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
      
      const updates = [];
      
      // Process each schedule separately to ensure we have individual payment records
      for (const scheduleId of scheduleIds) {
        // First check if the trainer payment record exists
        const { data: existingPayments } = await supabase
          .from('trainer_payments')
          .select('id, status')
          .eq('trainer_id', trainerId)
          .eq('class_schedule_id', scheduleId);
          
        if (existingPayments && existingPayments.length > 0) {
          // Update existing payment record
          const { error } = await supabase
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
            .eq('class_schedule_id', scheduleId);
            
          if (error) {
            console.error(`Error updating payment for schedule ${scheduleId}:`, error);
            throw error;
          }
          
          updates.push({ scheduleId, action: 'updated' });
        } else {
          // Create new payment record
          // First get booking information for this schedule to calculate payment amount
          const { data: bookings } = await supabase
            .from('bookings')
            .select('id')
            .eq('class_schedule_id', scheduleId);
          
          // Get class details to calculate payment amount
          const { data: scheduleData } = await supabase
            .from('class_schedules')
            .select(`
              id, 
              classes:class_id (
                id, 
                name, 
                trainer_fee_type, 
                trainer_fee_value, 
                course_fee
              )
            `)
            .eq('id', scheduleId)
            .single();
            
          if (!scheduleData || !scheduleData.classes) {
            console.error(`No class data found for schedule ${scheduleId}`);
            continue;
          }
          
          // Calculate payment amount based on trainer fee configuration and bookings
          const classData = scheduleData.classes;
          let amount = 0;
          
          if (classData.trainer_fee_type === 'percentage') {
            // Calculate based on percentage of total possible revenue (course fee × booking count)
            const totalPotentialRevenue = classData.course_fee * (bookings?.length || 0);
            amount = totalPotentialRevenue * (classData.trainer_fee_value / 100);
          } else if (classData.trainer_fee_type === 'fixed') {
            // Fixed fee per booking
            amount = classData.trainer_fee_value * (bookings?.length || 1);
          }
          
          // Create the payment record
          const { error } = await supabase
            .from('trainer_payments')
            .insert({
              trainer_id: trainerId,
              class_schedule_id: scheduleId,
              amount: amount,
              status: 'paid',
              payment_date: now,
              payment_method: paymentMethod,
              transaction_id: transactionId || null,
              notes: notes || null,
              document_url: documentUrl || null,
              document_name: documentName || null
            });
            
          if (error) {
            console.error(`Error creating payment for schedule ${scheduleId}:`, error);
            throw error;
          }
          
          updates.push({ scheduleId, action: 'created' });
        }
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
      
      return { trainerId, scheduleIds, updates };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['trainer-payment-history'] });
      
      // Log the updates for debugging
      console.log("Payment updates completed:", data.updates);
      
      toast.success("Payments marked as paid successfully");
    },
    onError: (error) => {
      console.error("Error marking trainer payments as paid:", error);
      toast.error("Failed to update payment status");
    }
  });
}
