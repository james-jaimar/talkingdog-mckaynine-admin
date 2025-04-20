
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
          // Get class schedules for this trainer within date range
          const { data: schedules, error: schedulesError } = await supabase
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
            .eq('trainer_id', trainer.id)
            .gte('start_time', fromDate || '')
            .lte('start_time', toDate || '');

          if (schedulesError) {
            console.error(`Error fetching schedules for trainer ${trainer.id}:`, schedulesError);
            return null;
          }

          if (!schedules || schedules.length === 0) {
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

          // Collect schedule IDs
          const scheduleIds = schedules.map(s => s.id);

          // Get all bookings for these schedules
          const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
              id,
              client_id,
              class_schedule_id,
              payment_status
            `)
            .in('class_schedule_id', scheduleIds);

          if (bookingsError) {
            console.error(`Error fetching bookings for trainer ${trainer.id}:`, bookingsError);
            return null;
          }

          // Get invoice items for these bookings to calculate revenue
          const bookingIds = bookings?.map(b => b.id) || [];
          
          // If no bookings, return trainer with zero financial values
          if (bookingIds.length === 0) {
            return {
              id: trainer.id,
              trainerName: `${trainer.first_name} ${trainer.last_name}`,
              totalEarned: 0,
              paid: 0,
              pending: 0,
              classesCount: schedules.length,
              clients: 0,
              scheduleIds,
              classDetails: []
            };
          }

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
            .in('booking_id', bookingIds);

          if (itemsError) {
            console.error(`Error fetching invoice items for trainer ${trainer.id}:`, itemsError);
            return null;
          }

          // Initialize class details tracking
          const classDetailsMap = new Map<string, TrainerClassDetail>();
          
          // Group bookings by class schedule for class details
          schedules.forEach(schedule => {
            const scheduleBookings = bookings?.filter(b => b.class_schedule_id === schedule.id) || [];
            const scheduleDate = new Date(schedule.start_time);
            
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
              } else if (feeType === 'fixed') {
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
          
          return {
            id: trainer.id,
            trainerName: `${trainer.first_name} ${trainer.last_name}`,
            totalEarned,
            paid: paidAmount,
            pending: totalEarned - paidAmount,
            classesCount: schedules.length,
            clients: uniqueClientIds.size,
            scheduleIds,
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
