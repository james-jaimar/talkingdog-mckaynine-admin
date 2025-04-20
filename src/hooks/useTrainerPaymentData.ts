
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrainerPaymentData {
  id: string;
  trainerName: string;
  totalEarned: number;
  paid: number;
  pending: number;
  classesCount: number;
  clients: number;
  lastPaymentDate?: string;
  scheduleIds: string[];
}

export function useTrainerPaymentData(branchId?: string, dateRange?: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['trainer-payments', branchId, dateRange],
    queryFn: async () => {
      if (!branchId) return [];

      try {
        const fromDate = dateRange?.from.toISOString();
        const toDate = dateRange?.to?.toISOString();
        
        // Get trainers with their payment data
        const { data: trainersData, error: trainersError } = await supabase
          .from('trainers')
          .select(`
            id,
            first_name,
            last_name,
            trainer_payments!inner (
              id,
              amount,
              status,
              payment_date,
              class_schedule_id
            ),
            class_schedules!trainer_id (
              id,
              bookings (
                id,
                client_id
              )
            )
          `)
          .eq('branch_id', branchId)
          .gte('trainer_payments.created_at', fromDate)
          .lte('trainer_payments.created_at', toDate);

        if (trainersError) {
          console.error('Error fetching trainer payments:', trainersError);
          throw trainersError;
        }

        // Process and aggregate trainer payment data
        const processedData: TrainerPaymentData[] = trainersData.map(trainer => {
          const payments = trainer.trainer_payments || [];
          const schedules = trainer.class_schedules || [];
          
          // Calculate totals
          const totalEarned = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
          const paidAmount = payments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + (p.amount || 0), 0);
          
          // Get unique client count
          const uniqueClients = new Set(
            schedules.flatMap(s => s.bookings?.map(b => b.client_id) || [])
          );

          // Find last payment date
          const paidPayments = payments
            .filter(p => p.status === 'paid' && p.payment_date)
            .sort((a, b) => new Date(b.payment_date!).getTime() - new Date(a.payment_date!).getTime());

          return {
            id: trainer.id,
            trainerName: `${trainer.first_name} ${trainer.last_name}`,
            totalEarned,
            paid: paidAmount,
            pending: totalEarned - paidAmount,
            classesCount: schedules.length,
            clients: uniqueClients.size,
            lastPaymentDate: paidPayments[0]?.payment_date,
            scheduleIds: schedules.map(s => s.id)
          };
        });

        return processedData;
      } catch (error) {
        console.error("Error in useTrainerPaymentData:", error);
        throw error;
      }
    },
    enabled: !!branchId,
  });
}
