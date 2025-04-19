
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
        
        // For each trainer, fetch their invoice items and associated invoices
        const trainersWithPayments = await Promise.all(trainers.map(async (trainer) => {
          try {
            // Get all class schedules for this trainer
            const { data: schedules, error: schedulesError } = await supabase
              .from('class_schedules')
              .select('id')
              .eq('trainer_id', trainer.id);
              
            if (schedulesError) {
              console.error(`Error fetching schedules for trainer ${trainer.id}:`, schedulesError);
              return null;
            }
            
            if (!schedules?.length) {
              // Return trainer with zero earnings if they don't have any schedules
              return {
                id: trainer.id,
                trainerName: `${trainer.first_name} ${trainer.last_name}`,
                totalEarned: 0,
                paid: 0,
                pending: 0,
                invoicesCount: 0
              };
            }
            
            const scheduleIds = schedules.map(s => s.id);
            
            // Get all bookings for these class schedules
            const { data: bookings, error: bookingsError } = await supabase
              .from('bookings')
              .select('id')
              .in('class_schedule_id', scheduleIds);
              
            if (bookingsError) {
              console.error(`Error fetching bookings for trainer ${trainer.id}:`, bookingsError);
              return null;
            }
            
            if (!bookings?.length) {
              // Return trainer with zero earnings if they don't have any bookings
              return {
                id: trainer.id,
                trainerName: `${trainer.first_name} ${trainer.last_name}`,
                totalEarned: 0,
                paid: 0,
                pending: 0,
                invoicesCount: 0
              };
            }
            
            const bookingIds = bookings.map(b => b.id);
            
            // Get all invoice items related to these bookings
            const { data: invoiceItems, error: itemsError } = await supabase
              .from('invoice_items')
              .select(`
                id,
                amount,
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
              // Return trainer with zero earnings if they don't have any invoice items
              return {
                id: trainer.id,
                trainerName: `${trainer.first_name} ${trainer.last_name}`,
                totalEarned: 0,
                paid: 0,
                pending: 0,
                invoicesCount: 0
              };
            }
            
            // Filter to only active invoice items (invoices that are not cancelled)
            const activeItems = invoiceItems.filter(item => 
              item.invoices && item.invoices.status !== 'cancelled'
            );
            
            // Sum up all active invoice items
            const totalEarned = activeItems.reduce(
              (sum, item) => sum + (item.amount || 0), 0
            );
            
            // Calculate paid amount (from items with paid invoices)
            const paidItems = activeItems.filter(
              item => item.invoices?.status === 'paid'
            );
            
            const paidAmount = paidItems.reduce(
              (sum, item) => sum + (item.amount || 0), 0
            );
            
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
            
            // Get list of unique invoice IDs for counting
            const uniqueInvoiceIds = new Set(
              activeItems.map(item => item.invoice_id)
            ).size;
            
            return {
              id: trainer.id,
              trainerName: `${trainer.first_name} ${trainer.last_name}`,
              totalEarned: totalEarned,
              paid: paidAmount,
              pending: totalEarned - paidAmount,
              invoicesCount: uniqueInvoiceIds,
              lastPaymentDate: lastPaymentDate || undefined
            };
            
          } catch (err) {
            console.error(`Error processing payment data for trainer ${trainer.id}:`, err);
            return null;
          }
        }));
        
        // Filter out null values and return
        return trainersWithPayments.filter(Boolean);
        
      } catch (err) {
        console.error("Failed to process trainer payment data:", err);
        toast.error("Error processing trainer payment data");
        return [];
      }
    },
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    meta: {
      onError: (error: Error) => {
        console.error("Error in useTrainerPayments hook:", error);
        toast.error("Failed to load trainer payment data");
      }
    }
  });
}
