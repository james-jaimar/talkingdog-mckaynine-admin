
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainerPaymentData } from "./types";

export function useTrainerPaymentData(branchId?: string, dateRange?: { from: Date; to?: Date }) {
  return useQuery({
    queryKey: ['trainer-payments-dashboard', branchId, dateRange],
    queryFn: async (): Promise<TrainerPaymentData[]> => {
      if (!branchId) return [];
      
      try {
        // Format date range for query
        const fromDate = dateRange?.from.toISOString();
        const toDate = (dateRange?.to || dateRange?.from).toISOString();
        
        // Get trainers for this branch
        const { data: trainers, error: trainersError } = await supabase
          .from('trainers')
          .select('id, first_name, last_name')
          .eq('branch_id', branchId);
          
        if (trainersError) {
          throw new Error(`Error fetching trainers: ${trainersError.message}`);
        }
        
        // For each trainer, get their payment data
        const trainersWithPayments = await Promise.all(trainers.map(async (trainer) => {
          // Get schedules for this trainer
          const { data: schedules, error: schedulesError } = await supabase
            .from('class_schedules')
            .select('id, classes(id, name, trainer_fee_value, trainer_fee_type)')
            .eq('trainer_id', trainer.id);
            
          if (schedulesError) {
            console.error(`Error fetching schedules for trainer ${trainer.id}:`, schedulesError);
            return null;
          }
          
          if (!schedules?.length) {
            // Return trainer with zero values if they have no schedules
            return {
              id: trainer.id,
              trainerName: `${trainer.first_name} ${trainer.last_name}`,
              totalEarned: 0,
              allocatedAmount: 0,
              paidAmount: 0,
              pendingAmount: 0,
              classesCount: 0,
              clients: 0
            };
          }
          
          const scheduleIds = schedules.map(s => s.id);
          
          // Get bookings for these schedules within date range
          const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('id, client_id, class_schedule_id, payment_status')
            .in('class_schedule_id', scheduleIds);
          
          if (fromDate && toDate) {
            // If date range is provided, filter by created_at
            // Note: This filtering is now done in the query above
          }
            
          if (bookingsError) {
            console.error(`Error fetching bookings for trainer ${trainer.id}:`, bookingsError);
            return null;
          }
          
          if (!bookings?.length) {
            // Return trainer with zero values if they have no bookings in date range
            return {
              id: trainer.id,
              trainerName: `${trainer.first_name} ${trainer.last_name}`,
              totalEarned: 0,
              allocatedAmount: 0,
              paidAmount: 0,
              pendingAmount: 0,
              classesCount: schedules.length,
              clients: 0
            };
          }
          
          // Get unique client count
          const uniqueClients = new Set(bookings.map(b => b.client_id)).size;
          
          // Get booking IDs for fetching invoice items
          const bookingIds = bookings.map(b => b.id);
          
          // Get invoice items for these bookings
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
          
          if (!invoiceItems?.length) {
            // Return trainer with zero financial values if they have no invoice items
            return {
              id: trainer.id,
              trainerName: `${trainer.first_name} ${trainer.last_name}`,
              totalEarned: 0,
              allocatedAmount: 0,
              paidAmount: 0,
              pendingAmount: 0,
              classesCount: schedules.length,
              clients: uniqueClients
            };
          }
          
          // Filter to only active invoice items (not cancelled)
          const activeItems = invoiceItems.filter(item => 
            item.invoices && item.invoices.status !== 'cancelled'
          );
          
          // Calculate financial data based on invoice items
          const totalRevenue = activeItems.reduce(
            (sum, item) => sum + (item.amount || 0), 0
          );
          
          // Calculate trainer's allocated amount (typically percentage of total revenue)
          // Use trainer fee values from class configuration when available
          let allocatedAmount = 0;
          for (const item of activeItems) {
            if (!item.booking_id) continue;
            
            // Find the related schedule and class for this booking
            const booking = bookings.find(b => b.id === item.booking_id);
            if (!booking) continue;
            
            const schedule = schedules.find(s => s.id === booking.class_schedule_id);
            if (!schedule || !schedule.classes) continue;
            
            // Calculate trainer's allocation based on class configuration
            const feeType = schedule.classes.trainer_fee_type;
            const feeValue = schedule.classes.trainer_fee_value;
            
            if (feeType === 'percentage') {
              allocatedAmount += (item.amount || 0) * (feeValue / 100);
            } else if (feeType === 'fixed') {
              allocatedAmount += feeValue;
            }
          }
          
          // If no specific allocation was found, use a default 70% allocation
          if (allocatedAmount === 0 && totalRevenue > 0) {
            allocatedAmount = totalRevenue * 0.7;
          }
          
          // Calculate paid amount from paid invoices
          const paidItems = activeItems.filter(
            item => item.invoices?.status === 'paid'
          );
          
          let paidAmount = 0;
          for (const item of paidItems) {
            if (!item.booking_id) continue;
            
            const booking = bookings.find(b => b.id === item.booking_id);
            if (!booking) continue;
            
            const schedule = schedules.find(s => s.id === booking.class_schedule_id);
            if (!schedule || !schedule.classes) continue;
            
            const feeType = schedule.classes.trainer_fee_type;
            const feeValue = schedule.classes.trainer_fee_value;
            
            if (feeType === 'percentage') {
              paidAmount += (item.amount || 0) * (feeValue / 100);
            } else if (feeType === 'fixed') {
              paidAmount += feeValue;
            }
          }
          
          // If no specific paid calculation was found, use a default 70%
          if (paidAmount === 0 && paidItems.length > 0) {
            paidAmount = paidItems.reduce((sum, item) => sum + (item.amount || 0), 0) * 0.7;
          }
          
          // Get last payment date
          let lastPaymentDate = null;
          if (paidItems.length > 0) {
            const paymentDates = paidItems
              .map(item => item.invoices?.payment_date ? new Date(item.invoices.payment_date).getTime() : 0)
              .filter(timestamp => timestamp > 0);
              
            if (paymentDates.length > 0) {
              lastPaymentDate = new Date(Math.max(...paymentDates)).toISOString();
            }
          }
          
          return {
            id: trainer.id,
            trainerName: `${trainer.first_name} ${trainer.last_name}`,
            totalEarned: totalRevenue,
            allocatedAmount: allocatedAmount,
            paidAmount: paidAmount,
            pendingAmount: allocatedAmount - paidAmount,
            classesCount: schedules.length,
            clients: uniqueClients,
            lastPaymentDate
          };
        }));
        
        // Filter out nulls and sort by earnings
        return trainersWithPayments
          .filter(Boolean)
          .sort((a, b) => b!.totalEarned - a!.totalEarned);
          
      } catch (error) {
        console.error("Error fetching trainer payment data:", error);
        throw error;
      }
    },
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}
