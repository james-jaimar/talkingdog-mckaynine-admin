
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
          // First fetch schedules for this trainer
          const schedules = await fetchSchedules(trainer.id);
          
          if (!schedules || schedules.length === 0) {
            // No schedules, return trainer with zeroed data
            return formatTrainerPaymentData(trainer, [], [], [], []);
          }

          // Fetch bookings for all schedules
          const bookings = await fetchBookings(
            schedules.map(s => s.id), 
            fromDate && toDate ? { from: fromDate, to: toDate } : undefined
          );
          
          // Fetch trainer payments for this trainer
          const payments = await fetchTrainerPayments(
            trainer.id,
            fromDate && toDate ? { from: fromDate, to: toDate } : undefined
          );
          
          // If no bookings, return trainer with schedules but no financial data
          if (!bookings || bookings.length === 0) {
            return formatTrainerPaymentData(trainer, schedules, [], [], payments);
          }

          // Fetch invoice items for all bookings to calculate potential earnings
          const invoiceItems = await fetchInvoiceItems(bookings.map(b => b.id));
          
          // Format data to calculate both actual and potential earnings
          return formatTrainerPaymentData(trainer, schedules, bookings, invoiceItems, payments);
        }));

        // Filter out any null entries and sort alphabetically by name
        return trainerPayments
          .filter(Boolean)
          .sort((a, b) => a.trainerName.localeCompare(b.trainerName));

      } catch (error) {
        console.error("Error in useTrainerPaymentData:", error);
        throw error;
      }
    },
    enabled: !!branchId,
    staleTime: 0, // Always treat data as stale
    refetchOnMount: true, // Always refetch when component mounts
    gcTime: 0 // Don't keep in cache
  });
}
