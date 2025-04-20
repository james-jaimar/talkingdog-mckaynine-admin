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
  classDetails?: TrainerClassDetail[];
  expanded?: boolean;
}

export interface TrainerClassDetail {
  scheduleId: string;
  className: string;
  classDate: string;
  revenue: number;
  bookings: number;
  isPaid: boolean;
  scheduleDate: Date;
}

export function useTrainerPaymentData(branchId?: string, dateRange?: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['trainer-payments', branchId, dateRange],
    queryFn: async () => {
      if (!branchId) return [];

      try {
        const fromDate = dateRange?.from.toISOString();
        const toDate = dateRange?.to.toISOString();
        
        // First, get all trainers for this branch
        const { data: trainers, error: trainerError } = await supabase
          .from('trainers')
          .select(`
            id,
            first_name,
            last_name
          `)
          .eq('branch_id', branchId);

        if (trainerError) {
          console.error('Error fetching trainers:', trainerError);
          throw trainerError;
        }

        // For each trainer, get their classes and calculate earnings
        const trainerPayments = await Promise.all(trainers.map(async (trainer) => {
          console.log(`Processing trainer: ${trainer.first_name} ${trainer.last_name} (${trainer.id})`);
          
          // Get ALL class schedules for this trainer, not just within date range
          // We'll filter by date range later if needed, but first we need to get all schedules
          const { data: allSchedules, error: schedulesError } = await supabase
            .from('class_schedules')
            .select(`
              id,
              start_time,
              end_time,
              classes:class_id (
                id,
                name,
                trainer_fee_type,
                trainer_fee_value
              )
            `)
            .eq('trainer_id', trainer.id);

          if (schedulesError) {
            console.error(`Error fetching schedules for trainer ${trainer.id}:`, schedulesError);
            return null;
          }

          console.log(`Trainer ${trainer.first_name} has ${allSchedules?.length || 0} total schedules`);

          // Filter schedules by date range only for financial calculations
          // But keep the total count of all schedules for the classesCount
          const schedules = allSchedules?.filter(schedule => {
            if (!fromDate || !toDate) return true;
            const scheduleDate = new Date(schedule.start_time);
            return scheduleDate >= new Date(fromDate) && scheduleDate <= new Date(toDate);
          }) || [];

          // Keep all schedule IDs for reference, but only use filtered ones for financial calculations
          const allScheduleIds = allSchedules?.map(s => s.id) || [];
          const filteredScheduleIds = schedules.map(s => s.id);

          console.log(`Trainer ${trainer.first_name} has ${schedules.length} schedules in the date range`);
          
          if (!allSchedules || allSchedules.length === 0) {
            // Return basic trainer info with zero values if they have no schedules
            return {
              id: trainer.id,
              trainerName: `${trainer.first_name} ${trainer.last_name}`,
              totalEarned: 0,
              paid: 0,
              pending: 0,
              classesCount: 0,
              clients: 0,
              scheduleIds: [],
              classDetails: []
            };
          }

          // Get all bookings for the filtered schedules for financial calculations
          const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
              id,
              client_id,
              class_schedule_id,
              payment_status
            `)
            .in('class_schedule_id', filteredScheduleIds.length > 0 ? filteredScheduleIds : ['no-schedules']);

          if (bookingsError) {
            console.error(`Error fetching bookings for trainer ${trainer.id}:`, bookingsError);
            return null;
          }

          console.log(`Trainer ${trainer.first_name} has ${bookings?.length || 0} bookings in the filtered schedules`);

          // Initialize class details tracking for all schedules
          const classDetailsMap = new Map<string, TrainerClassDetail>();
          
          // Group bookings by class schedule for class details
          allSchedules.forEach(schedule => {
            const scheduleBookings = bookings?.filter(b => b.class_schedule_id === schedule.id) || [];
            const scheduleDate = new Date(schedule.start_time);
            
            // Add every schedule as a class detail, even if it has no bookings
            classDetailsMap.set(schedule.id, {
              scheduleId: schedule.id,
              className: schedule.classes?.name || 'Unknown Class',
              classDate: scheduleDate.toISOString(),
              scheduleDate,
              revenue: 0,
              bookings: scheduleBookings.length,
              isPaid: false
            });
          });

          // If no bookings, return trainer with basic financial info but correct class count
          if (!bookings || bookings.length === 0) {
            return {
              id: trainer.id,
              trainerName: `${trainer.first_name} ${trainer.last_name}`,
              totalEarned: 0,
              paid: 0,
              pending: 0,
              classesCount: allSchedules.length, // Use total schedules count
              clients: 0,
              scheduleIds: allScheduleIds, // Keep all schedule IDs
              classDetails: Array.from(classDetailsMap.values())
            };
          }

          // Get invoice items for these bookings to calculate revenue
          const bookingIds = bookings?.map(b => b.id) || [];
          
          const { data: invoiceItems, error: itemsError } = await supabase
            .from('invoice_items')
            .select(`
              id,
              amount,
              booking_id,
              invoice_id,
              invoices:invoice_id (
                id,
                status,
                payment_date
              )
            `)
            .in('booking_id', bookingIds.length > 0 ? bookingIds : ['no-bookings']);

          if (itemsError) {
            console.error(`Error fetching invoice items for trainer ${trainer.id}:`, itemsError);
            return null;
          }

          console.log(`Trainer ${trainer.first_name} has ${invoiceItems?.length || 0} invoice items`);

          // Calculate earnings for each invoice item based on class fee structure
          let totalEarned = 0;
          let paidAmount = 0;
          
          if (invoiceItems && invoiceItems.length > 0) {
            for (const item of invoiceItems) {
              if (!item.booking_id) continue;
              if (!item.invoices || item.invoices.status === 'cancelled') continue;
              
              // Find corresponding booking and schedule
              const booking = bookings?.find(b => b.id === item.booking_id);
              if (!booking) continue;
              
              const schedule = schedules.find(s => s.id === booking.class_schedule_id);
              if (!schedule || !schedule.classes) continue;
              
              // Calculate trainer's commission based on fee type and value
              const feeType = schedule.classes.trainer_fee_type;
              const feeValue = schedule.classes.trainer_fee_value || 0;
              const invoiceAmount = item.amount || 0;
              
              let trainerCommission = 0;
              if (feeType === 'percentage') {
                trainerCommission = invoiceAmount * (feeValue / 100);
              } else {
                trainerCommission = feeValue;
              }
              
              // Add to total earnings
              totalEarned += trainerCommission;
              
              // Check if this has been paid
              if (item.invoices.status === 'paid') {
                paidAmount += trainerCommission;
              }
              
              // Update class details
              const classDetail = classDetailsMap.get(booking.class_schedule_id);
              if (classDetail) {
                classDetail.revenue += trainerCommission;
                if (item.invoices.status === 'paid') {
                  classDetail.isPaid = true;
                }
              }
            }
          }
          
          // Get unique client count
          const uniqueClientIds = new Set(bookings?.map(b => b.client_id) || []);

          // Convert class details map to array and sort by date
          const classDetails = Array.from(classDetailsMap.values())
            .sort((a, b) => a.scheduleDate.getTime() - b.scheduleDate.getTime());
          
          console.log(`Final data for ${trainer.first_name}: ${allSchedules.length} classes, ${uniqueClientIds.size} clients`);
          
          return {
            id: trainer.id,
            trainerName: `${trainer.first_name} ${trainer.last_name}`,
            totalEarned,
            paid: paidAmount,
            pending: totalEarned - paidAmount,
            classesCount: allSchedules.length, // Use the total number of schedules
            clients: uniqueClientIds.size,
            scheduleIds: allScheduleIds, // Use all schedule IDs
            classDetails
          };
        }));

        // Filter out null values and sort by name
        return trainerPayments
          .filter(Boolean)
          .sort((a, b) => a!.trainerName.localeCompare(b!.trainerName));
      } catch (error) {
        console.error("Error in useTrainerPaymentData:", error);
        throw error;
      }
    },
    enabled: !!branchId,
  });
}
