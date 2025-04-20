
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useTrainerPayments(branchId: string | undefined) {
  return useQuery({
    queryKey: ['trainers', branchId],
    queryFn: async () => {
      if (!branchId) return [];
      
      try {
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
        
        // For each trainer, fetch their class schedules, bookings, and invoices
        const trainersWithPayments = await Promise.all(trainers.map(async (trainer) => {
          try {
            // Get all class schedules for this trainer
            const { data: schedules, error: schedulesError } = await supabase
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
              
            if (schedulesError) {
              console.error(`Error fetching schedules for trainer ${trainer.id}:`, schedulesError);
              return null;
            }
            
            if (!schedules?.length) {
              return {
                id: trainer.id,
                trainerName: `${trainer.first_name} ${trainer.last_name}`,
                totalEarned: 0,
                paid: 0,
                pending: 0,
                invoicesCount: 0,
                classesCount: 0,
                clients: 0
              };
            }
            
            const scheduleIds = schedules.map(s => s.id);
            
            // Get all bookings for these class schedules
            const { data: bookings, error: bookingsError } = await supabase
              .from('bookings')
              .select('id, client_id, class_schedule_id')
              .in('class_schedule_id', scheduleIds);
              
            if (bookingsError) {
              console.error(`Error fetching bookings for trainer ${trainer.id}:`, bookingsError);
              return null;
            }
            
            const uniqueClients = new Set(bookings?.map(b => b.client_id) || []).size;
            
            if (!bookings?.length) {
              return {
                id: trainer.id,
                trainerName: `${trainer.first_name} ${trainer.last_name}`,
                totalEarned: 0,
                paid: 0,
                pending: 0,
                invoicesCount: 0,
                classesCount: schedules.length,
                clients: uniqueClients
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
              
              const trainerEarnings = trainer_fee_type === 'percentage' 
                ? (item.amount * (trainer_fee_value / 100))
                : trainer_fee_value;
              
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
              // Include schedule IDs for payment marking
              scheduleIds
            };
          } catch (err) {
            console.error(`Error processing payment data for trainer ${trainer.id}:`, err);
            return null;
          }
        }));
        
        // Filter out null values and sort by earnings
        return trainersWithPayments
          .filter(Boolean)
          .sort((a, b) => b!.totalEarned - a!.totalEarned);
        
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
