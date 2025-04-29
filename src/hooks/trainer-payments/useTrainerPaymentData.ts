
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
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useTrainerPaymentData(branchId?: string, dateRange?: { from: Date; to: Date }) {
  const queryClient = useQueryClient();
  
  // Always invalidate trainer payment queries on mount to ensure fresh data
  useEffect(() => {
    if (branchId) {
      // Force invalidation of trainer payment data on every mount
      queryClient.invalidateQueries({ 
        queryKey: ['trainer-payments', branchId, dateRange],
        exact: true 
      });
    }
  }, [branchId, queryClient, dateRange]);
  
  return useQuery({
    queryKey: ['trainer-payments', branchId, dateRange],
    queryFn: async (): Promise<TrainerPaymentData[]> => {
      if (!branchId) return [];

      try {
        console.log(`Fetching fresh trainer payment data for branch ${branchId}`);
        
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
    staleTime: 0, // Always treat data as stale
    refetchOnMount: true, // Always refetch when component mounts
    gcTime: 0, // Don't keep in cache
    refetchOnWindowFocus: true // Also refetch when window regains focus
  });
}
