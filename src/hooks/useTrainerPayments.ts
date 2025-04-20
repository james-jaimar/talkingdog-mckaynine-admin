
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useTrainerPayments(branchId: string | undefined, dateRange?: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['trainers', branchId, dateRange],
    queryFn: async () => {
      if (!branchId) return [];
      
      try {
        console.log("Fetching trainer payments with date range:", dateRange);
        
        // Format date range for query if provided
        const fromDate = dateRange?.from ? dateRange.from.toISOString() : undefined;
        const toDate = dateRange?.to ? dateRange.to.toISOString() : undefined;
        
        // Get all trainers for this branch
        const { data: trainers, error: trainersError } = await supabase
          .from('trainers')
          .select(`
            id,
            first_name,
            last_name
          `)
          .eq('branch_id', branchId);
        
        if (trainersError) {
          console.error("Error fetching trainers:", trainersError);
          toast.error("Error loading trainer data");
          return [];
        }
        
        console.log(`Found ${trainers?.length} trainers for branch ${branchId}`);
        
        // For each trainer, fetch their class schedules, bookings, and invoices
        const trainersWithPayments = await Promise.all(trainers.map(async (trainer) => {
          try {
            console.log(`Processing trainer: ${trainer.first_name} ${trainer.last_name}`);
            
            // Get all class schedules for this trainer
            let schedulesQuery = supabase
              .from('class_schedules')
              .select(`
                id,
                classes (
                  id,
                  name,
                  course_fee,
                  trainer_fee_type,
                  trainer_fee_value
                )
              `)
              .eq('trainer_id', trainer.id);
              
            // Apply date filter if provided
            if (fromDate && toDate) {
              schedulesQuery = schedulesQuery.gte('start_time', fromDate).lte('start_time', toDate);
            }
            
            const { data: schedules, error: schedulesError } = await schedulesQuery;
              
            if (schedulesError) {
              console.error(`Error fetching schedules for trainer ${trainer.id}:`, schedulesError);
              return null;
            }
            
            console.log(`Found ${schedules?.length} schedules for trainer ${trainer.id}`);
            
            if (!schedules?.length) {
              return {
                id: trainer.id,
                trainerName: `${trainer.first_name} ${trainer.last_name}`,
                totalEarned: 0,
                paid: 0,
                pending: 0,
                classesCount: 0,
                clients: 0,
                invoicesCount: 0,
                scheduleIds: []
              };
            }
            
            const scheduleIds = schedules.map(s => s.id);
            
            // Get all bookings for these class schedules
            let bookingsQuery = supabase
              .from('bookings')
              .select('id, client_id, class_schedule_id, created_at');
            
            // Filter by schedule IDs
            bookingsQuery = bookingsQuery.in('class_schedule_id', scheduleIds);
            
            // Apply date filter if provided
            if (fromDate && toDate) {
              bookingsQuery = bookingsQuery.gte('created_at', fromDate).lte('created_at', toDate);
            }
            
            const { data: bookings, error: bookingsError } = await bookingsQuery;
              
            if (bookingsError) {
              console.error(`Error fetching bookings for trainer ${trainer.id}:`, bookingsError);
              return null;
            }
            
            console.log(`Found ${bookings?.length} bookings for trainer ${trainer.id}`);
            
            const uniqueClients = new Set(bookings?.map(b => b.client_id) || []).size;
            
            if (!bookings?.length) {
              return {
                id: trainer.id,
                trainerName: `${trainer.first_name} ${trainer.last_name}`,
                totalEarned: 0,
                paid: 0,
                pending: 0,
                classesCount: schedules.length,
                clients: uniqueClients,
                invoicesCount: 0,
                scheduleIds
              };
            }
            
            const bookingIds = bookings.map(b => b.id);
            
            // Get all invoice items related to these bookings
            const { data: invoiceItems, error: itemsError } = await supabase
              .from('invoice_items')
              .select(`
                id,
                amount,
                booking_id,
                invoice_id,
                invoices (
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
            
            console.log(`Found ${invoiceItems?.length} invoice items for trainer ${trainer.id}`);
            
            // Calculate earnings based on trainer fee configuration
            let totalEarned = 0;
            let paidAmount = 0;
            
            for (const item of (invoiceItems || [])) {
              if (!item.booking_id || !item.invoices || item.invoices.status === 'cancelled') continue;
              
              const booking = bookings.find(b => b.id === item.booking_id);
              if (!booking) continue;
              
              const schedule = schedules.find(s => s.id === booking.class_schedule_id);
              if (!schedule?.classes) continue;
              
              const { trainer_fee_type, trainer_fee_value } = schedule.classes;
              
              let trainerEarnings = 0;
              if (trainer_fee_type === 'percentage') {
                trainerEarnings = item.amount * (trainer_fee_value / 100);
              } else {
                trainerEarnings = trainer_fee_value;
              }
              
              totalEarned += trainerEarnings;
              
              if (item.invoices.status === 'paid') {
                paidAmount += trainerEarnings;
              }
            }
            
            // Get last payment date
            const paidInvoices = invoiceItems
              ?.filter(item => item.invoices?.status === 'paid')
              .map(item => item.invoices?.payment_date)
              .filter(Boolean)
              .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());
            
            const lastPaymentDate = paidInvoices?.length ? paidInvoices[0] : undefined;
            
            return {
              id: trainer.id,
              trainerName: `${trainer.first_name} ${trainer.last_name}`,
              totalEarned,
              paid: paidAmount,
              pending: totalEarned - paidAmount,
              classesCount: schedules.length,
              clients: uniqueClients,
              lastPaymentDate,
              invoicesCount: invoiceItems?.length || 0,
              scheduleIds
            };
          } catch (err) {
            console.error(`Error processing payment data for trainer ${trainer.id}:`, err);
            return null;
          }
        }));
        
        // Filter out null values and sort by earnings
        const validTrainers = trainersWithPayments
          .filter(Boolean)
          .sort((a, b) => b!.totalEarned - a!.totalEarned);
        
        console.log("Processed trainer payments data:", validTrainers);
        return validTrainers;
        
      } catch (err) {
        console.error("Failed to process trainer payment data:", err);
        toast.error("Error processing trainer payment data");
        return [];
      }
    },
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000 // 5 minutes cache
  });
}
