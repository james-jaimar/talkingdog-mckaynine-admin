
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
        const toDate = dateRange?.to.toISOString();
        
        // Get trainers with their payment data
        const { data: trainersData, error: trainersError } = await supabase
          .from('trainers')
          .select(`
            id,
            first_name,
            last_name,
            trainer_payments (
              id,
              amount,
              status,
              payment_date,
              class_schedule_id
            ),
            class_schedules!trainer_id (
              id,
              start_time,
              end_time,
              bookings (
                id,
                client_id
              )
            )
          `)
          .eq('branch_id', branchId);

        if (trainersError) {
          console.error('Error fetching trainer payments:', trainersError);
          throw trainersError;
        }

        // Process and aggregate trainer payment data
        const processedData: TrainerPaymentData[] = trainersData.map(trainer => {
          // Filter payments within date range
          const payments = trainer.trainer_payments?.filter(payment => {
            const schedule = trainer.class_schedules?.find(s => s.id === payment.class_schedule_id);
            if (!schedule) return false;
            
            const scheduleDate = new Date(schedule.start_time);
            return scheduleDate >= dateRange?.from && scheduleDate <= dateRange?.to;
          }) || [];

          const schedules = trainer.class_schedules?.filter(schedule => {
            const scheduleDate = new Date(schedule.start_time);
            return scheduleDate >= dateRange?.from && scheduleDate <= dateRange?.to;
          }) || [];
          
          // Calculate totals from filtered payments
          const totalEarned = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
          const paidAmount = payments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + (p.amount || 0), 0);
          
          // Get unique client count from filtered schedules
          const uniqueClients = new Set(
            schedules.flatMap(s => s.bookings?.map(b => b.client_id) || [])
          );

          // Find last payment date from filtered payments
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
