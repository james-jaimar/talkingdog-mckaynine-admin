
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainerPaymentHistoryItem } from "./trainer-payments/types";

interface UseTrainerPaymentHistoryOptions {
  limit?: number;
  trainerId?: string;
  startDate?: Date;
  endDate?: Date;
}

export function useTrainerPaymentHistory(options: UseTrainerPaymentHistoryOptions = {}) {
  const { limit = 10, trainerId, startDate, endDate } = options;

  return useQuery({
    queryKey: ['trainer-payment-history', trainerId, startDate, endDate, limit],
    queryFn: async (): Promise<TrainerPaymentHistoryItem[]> => {
      // Start building the query
      let query = supabase
        .from('trainer_payments')
        .select(`
          id,
          payment_date,
          payment_method,
          transaction_id,
          amount,
          document_url,
          document_name,
          class_schedule_id,
          trainer_id,
          trainers:trainer_id (first_name, last_name),
          class_schedules:class_schedule_id (
            classes:class_id (name)
          )
        `)
        .eq('status', 'paid')
        .order('payment_date', { ascending: false });

      // Apply optional filters
      if (trainerId) {
        query = query.eq('trainer_id', trainerId);
      }

      if (startDate) {
        query = query.gte('payment_date', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('payment_date', endDate.toISOString());
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching trainer payment history:', error);
        throw error;
      }

      // Transform the data to match our type
      const formattedData: TrainerPaymentHistoryItem[] = data.map(payment => {
        // Get class name from nested data
        const className = payment.class_schedules?.classes?.name || 'Unknown Class';
        
        // Get trainer name from nested data
        const trainerName = payment.trainers
          ? `${payment.trainers.first_name} ${payment.trainers.last_name}`
          : 'Unknown Trainer';

        return {
          id: payment.id,
          paymentDate: payment.payment_date || '',
          amount: payment.amount || 0,
          paymentMethod: payment.payment_method || 'other',
          transactionId: payment.transaction_id,
          documentUrl: payment.document_url,
          documentName: payment.document_name,
          scheduleId: payment.class_schedule_id,
          className,
          classDate: payment.payment_date || '', // As a fallback, using payment date
          trainerName
        };
      });

      return formattedData;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
