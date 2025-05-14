
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
import { useTerm } from "@/context/TermContext";

export function useTrainerPaymentData(branchId?: string, dateRange?: { from: Date; to: Date }) {
  // Get the current term ID
  const { termData } = useTerm();
  const currentTermId = termData?.id;

  const query = useQuery({
    queryKey: ['trainer-payments', branchId, dateRange, currentTermId],
    queryFn: async (): Promise<TrainerPaymentData[]> => {
      if (!branchId) return [];

      try {
        console.log(`Fetching trainer payment data for branch: ${branchId}`);
        const fromDate = dateRange?.from.toISOString();
        const toDate = dateRange?.to.toISOString();
        
        const trainers = await fetchTrainers(branchId);
        console.log(`Found ${trainers.length} trainers for branch ${branchId}`);
        
        const trainerPayments = await Promise.all(trainers.map(async (trainer) => {
          // First fetch schedules for this trainer, filtered by term
          const schedules = await fetchSchedules(trainer.id, currentTermId);
          
          if (!schedules || schedules.length === 0) {
            // No schedules, return trainer with zeroed data
            return formatTrainerPaymentData(trainer, [], [], [], []);
          }

          // Verify all schedules are for the correct branch
          const scheduleClassIds = schedules.map(s => s.class_id);
          const schedulesByBranch = schedules.filter(s => s.classes?.branch_id === branchId);
          
          if (schedulesByBranch.length !== schedules.length) {
            console.warn(
              `Found ${schedules.length - schedulesByBranch.length} schedules that don't match branch ${branchId}`,
              `Trainer: ${trainer.first_name} ${trainer.last_name}`
            );
          }

          // Fetch bookings for all schedules, filtered by branch
          const bookings = await fetchBookings(
            schedules.map(s => s.id), 
            fromDate && toDate ? { from: fromDate, to: toDate } : undefined,
            branchId
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

          // Fetch invoice items for all bookings to calculate potential earnings, with branch filtering
          const invoiceItems = await fetchInvoiceItems(bookings.map(b => b.id), branchId);
          
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
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Return both the query result and derived/helper values
  return {
    trainerPaymentsData: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refreshTrainerPayments: () => query.refetch()
  };
}
