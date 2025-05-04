
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatTrainerPaymentData } from "./utils/formatTrainerData";
import { TrainerPaymentData } from "./types";

export function useTrainerPaymentData(branchId?: string, dateRange?: { from: Date; to?: Date }) {
  return useQuery({
    queryKey: ['trainer-payments', branchId, dateRange],
    queryFn: async (): Promise<TrainerPaymentData[]> => {
      if (!branchId) return [];
      
      try {
        // Format date range for query
        const fromDate = dateRange?.from.toISOString();
        const toDate = (dateRange?.to || new Date()).toISOString();
        
        console.log(`Fetching trainer payment data for branch ${branchId} from ${fromDate} to ${toDate}`);
        
        // Get trainers for this branch
        const { data: trainers, error: trainersError } = await supabase
          .from('trainers')
          .select('id, first_name, last_name, email')
          .eq('branch_id', branchId);
          
        if (trainersError) {
          throw new Error(`Error fetching trainers: ${trainersError.message}`);
        }
        
        if (!trainers || trainers.length === 0) {
          console.log("No trainers found for branch", branchId);
          return [];
        }
        
        console.log(`Found ${trainers.length} trainers`);
        
        // For each trainer, get all related data in one efficient query
        const trainersPaymentData = await Promise.all(trainers.map(async (trainer) => {
          // Step 1: Get schedules for this trainer within date range
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
                trainer_fee_value,
                course_fee
              )
            `)
            .eq('trainer_id', trainer.id)
            .gte('start_time', fromDate)
            .lte('start_time', toDate);
            
          if (schedulesError) {
            console.error(`Error fetching schedules for trainer ${trainer.id}:`, schedulesError);
            return null;
          }
          
          if (!schedules?.length) {
            // Return trainer with zero values if they have no schedules
            return {
              id: trainer.id,
              trainerName: `${trainer.first_name} ${trainer.last_name}`,
              trainerEmail: trainer.email,
              totalEarned: 0,
              allocatedAmount: 0,
              paid: 0,
              pending: 0,
              potentialEarnings: 0,
              classesCount: 0,
              clients: 0,
              classDetails: [],
              hasUnpaidCommission: false,
              hasZeroCommissionClasses: false
            };
          }
          
          const scheduleIds = schedules.map(s => s.id);
          
          // Step 2: Get all bookings for these schedules
          const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
              id,
              client_id,
              class_schedule_id,
              payment_status,
              clients:client_id (
                id,
                first_name,
                last_name
              )
            `)
            .in('class_schedule_id', scheduleIds);
            
          if (bookingsError) {
            console.error(`Error fetching bookings for trainer ${trainer.id}:`, bookingsError);
            return null;
          }
          
          // Step 3: Get invoice items for these bookings
          const bookingIds = bookings?.map(b => b.id) || [];
          
          const { data: invoiceItems, error: invoiceItemsError } = await supabase
            .from('invoice_items')
            .select(`
              id,
              amount,
              booking_id,
              invoice_id,
              invoices:invoice_id (
                id,
                status,
                payment_date,
                total
              )
            `)
            .in('booking_id', bookingIds);
            
          if (invoiceItemsError) {
            console.error(`Error fetching invoice items for trainer ${trainer.id}:`, invoiceItemsError);
            return null;
          }
          
          // Step 4: Get payment records for this trainer
          const { data: payments, error: paymentsError } = await supabase
            .from('trainer_payments')
            .select('id, status, amount, payment_date, class_schedule_id')
            .eq('trainer_id', trainer.id)
            .in('class_schedule_id', scheduleIds);
            
          if (paymentsError) {
            console.error(`Error fetching payment records for trainer ${trainer.id}:`, paymentsError);
            return null;
          }
          
          // Format all the data into a structured trainer payment record
          return formatTrainerPaymentData(
            trainer, 
            schedules || [], 
            bookings || [], 
            invoiceItems || [],
            payments || []
          );
        }));
        
        // Filter out nulls (failed queries) and sort by trainer name
        return trainersPaymentData
          .filter(Boolean)
          .sort((a, b) => a.trainerName.localeCompare(b.trainerName));
        
      } catch (error) {
        console.error("Error in useTrainerPaymentData:", error);
        throw error;
      }
    },
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
