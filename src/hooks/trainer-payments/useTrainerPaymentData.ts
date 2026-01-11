
import { useQuery } from "@tanstack/react-query";
import { 
  fetchTrainers, 
  fetchAllSchedulesForTrainers,
  fetchAllBookings,
  fetchAllInvoiceItems,
  fetchAllTrainerPayments
} from "./queries/fetchTrainerData";
import { formatTrainerPaymentData } from "./utils/formatTrainerData";
import { TrainerPaymentData } from "./types";
import { useTerm } from "@/context/TermContext";

export function useTrainerPaymentData(branchId?: string, dateRange?: { from: Date; to: Date }) {
  const { termData } = useTerm();
  const currentTermId = termData?.id;

  const fromKey = dateRange?.from ? dateRange.from.toISOString().slice(0, 10) : undefined;
  const toKey = dateRange?.to ? dateRange.to.toISOString().slice(0, 10) : undefined;

  return useQuery({
    queryKey: ['trainer-payments', branchId, fromKey, toKey, currentTermId],
    queryFn: async (): Promise<TrainerPaymentData[]> => {
      if (!branchId) return [];

      try {
        console.log(`Fetching trainer payment data for branch: ${branchId}`);
        
        // Step 1: Fetch all trainers for this branch (single query)
        const trainers = await fetchTrainers(branchId);
        console.log(`Found ${trainers.length} trainers for branch ${branchId}`);
        
        if (trainers.length === 0) return [];
        
        const trainerIds = trainers.map(t => t.id);
        
        // Step 2: Fetch all schedules for all trainers at once (single query)
        const allSchedules = await fetchAllSchedulesForTrainers(trainerIds, currentTermId);
        console.log(`Found ${allSchedules.length} schedules for all trainers`);
        
        // Filter schedules by branch and create a lookup map by trainer
        const schedulesByTrainer = new Map<string, typeof allSchedules>();
        allSchedules.forEach(schedule => {
          if (schedule.classes?.branch_id === branchId) {
            const existing = schedulesByTrainer.get(schedule.trainer_id) || [];
            existing.push(schedule);
            schedulesByTrainer.set(schedule.trainer_id, existing);
          }
        });
        
        // Get all schedule IDs for fetching bookings and payments
        const allScheduleIds = allSchedules
          .filter(s => s.classes?.branch_id === branchId)
          .map(s => s.id);
        
        // Step 3: Fetch all bookings for all schedules at once (single query)
        const allBookings = allScheduleIds.length > 0 
          ? await fetchAllBookings(allScheduleIds, branchId)
          : [];
        console.log(`Found ${allBookings.length} bookings for all schedules`);
        
        // Create a lookup map by schedule ID
        const bookingsBySchedule = new Map<string, typeof allBookings>();
        allBookings.forEach(booking => {
          const scheduleId = booking.class_schedule_id;
          const existing = bookingsBySchedule.get(scheduleId) || [];
          existing.push(booking);
          bookingsBySchedule.set(scheduleId, existing);
        });
        
        // Step 4: Fetch all trainer payments for all trainers at once (single query)
        const allPayments = await fetchAllTrainerPayments(trainerIds, allScheduleIds.length > 0 ? allScheduleIds : undefined);
        console.log(`Found ${allPayments.length} payments for all trainers`);
        
        // Create a lookup map by trainer ID
        const paymentsByTrainer = new Map<string, typeof allPayments>();
        allPayments.forEach(payment => {
          const trainerId = payment.trainer_id;
          const existing = paymentsByTrainer.get(trainerId) || [];
          existing.push(payment);
          paymentsByTrainer.set(trainerId, existing);
        });
        
        // Step 5: Fetch all invoice items for all bookings at once (single query)
        const allBookingIds = allBookings.map(b => b.id);
        const allInvoiceItems = allBookingIds.length > 0 
          ? await fetchAllInvoiceItems(allBookingIds, branchId)
          : [];
        console.log(`Found ${allInvoiceItems.length} invoice items for all bookings`);
        
        // Create a lookup map by booking ID
        const invoiceItemsByBooking = new Map<string, typeof allInvoiceItems>();
        allInvoiceItems.forEach(item => {
          if (item.booking_id) {
            const existing = invoiceItemsByBooking.get(item.booking_id) || [];
            existing.push(item);
            invoiceItemsByBooking.set(item.booking_id, existing);
          }
        });
        
        // Step 6: Process each trainer using the pre-fetched data (no additional queries!)
        const trainerPayments = trainers.map(trainer => {
          const trainerSchedules = schedulesByTrainer.get(trainer.id) || [];
          const trainerPaymentsData = paymentsByTrainer.get(trainer.id) || [];
          
          if (trainerSchedules.length === 0) {
            return formatTrainerPaymentData(trainer, [], [], [], []);
          }
          
          // Collect bookings for this trainer's schedules
          const trainerBookings: typeof allBookings = [];
          trainerSchedules.forEach(schedule => {
            const scheduleBookings = bookingsBySchedule.get(schedule.id) || [];
            trainerBookings.push(...scheduleBookings);
          });
          
          if (trainerBookings.length === 0) {
            return formatTrainerPaymentData(trainer, trainerSchedules, [], [], trainerPaymentsData);
          }
          
          // Collect invoice items for this trainer's bookings
          const trainerInvoiceItems: typeof allInvoiceItems = [];
          trainerBookings.forEach(booking => {
            const bookingItems = invoiceItemsByBooking.get(booking.id) || [];
            trainerInvoiceItems.push(...bookingItems);
          });
          
          return formatTrainerPaymentData(trainer, trainerSchedules, trainerBookings, trainerInvoiceItems, trainerPaymentsData);
        });

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
}
