
import { useQuery } from "@tanstack/react-query";
import { 
  fetchTrainers, 
  fetchSchedules, 
  fetchBookings, 
  fetchInvoiceItems,
  fetchTrainerPayments 
} from "./queries/fetchTrainerData";
import { formatTrainerPaymentData } from "./utils/formatTrainerData";
import { TrainerPaymentData } from "./types";

export function useTrainerPaymentData(branchId?: string, dateRange?: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['trainer-payments', branchId, dateRange],
    queryFn: async (): Promise<TrainerPaymentData[]> => {
      if (!branchId) return [];

      try {
        const fromDate = dateRange?.from.toISOString();
        const toDate = dateRange?.to.toISOString();
        
        const trainers = await fetchTrainers(branchId);
        
        const trainerPayments = await Promise.all(trainers.map(async (trainer) => {
          const schedules = await fetchSchedules(trainer.id);
          
          if (!schedules || schedules.length === 0) {
            return formatTrainerPaymentData(trainer, [], [], [], []);
          }

          const bookings = await fetchBookings(
            schedules.map(s => s.id), 
            fromDate && toDate ? { from: fromDate, to: toDate } : undefined
          );
          
          const payments = await fetchTrainerPayments(
            trainer.id,
            fromDate && toDate ? { from: fromDate, to: toDate } : undefined
          );

          if (!bookings || bookings.length === 0) {
            return formatTrainerPaymentData(trainer, schedules, [], [], payments);
          }

          const invoiceItems = await fetchInvoiceItems(bookings.map(b => b.id));
          
          return formatTrainerPaymentData(trainer, schedules, bookings, invoiceItems, payments);
        }));

        return trainerPayments
          .filter(Boolean)
          .sort((a, b) => a.trainerName.localeCompare(b.trainerName));

      } catch (error) {
        console.error("Error in useTrainerPaymentData:", error);
        throw error;
      }
    },
    enabled: !!branchId,
  });
}
