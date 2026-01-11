
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { formatCurrency } from "@/lib/formatters";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { isEnrollmentFeeItem } from "@/lib/invoiceItemUtils";

interface TrainerPaymentReportProps {
  branchId?: string;
  dateRange: { from: Date; to?: Date };
  isLoading: boolean;
}

export function TrainerPaymentReport({ branchId, dateRange, isLoading }: TrainerPaymentReportProps) {
  const fromKey = dateRange?.from ? dateRange.from.toISOString().slice(0, 10) : undefined;
  const toKey = dateRange?.to ? dateRange.to.toISOString().slice(0, 10) : undefined;

  const { data: trainers = [], isLoading: isLoadingTrainers } = useQuery({
    queryKey: ['trainer-payment-report', branchId, fromKey, toKey],
    queryFn: async () => {
      if (!branchId) return [];
      
      try {
        const fromDate = dateRange.from.toISOString();
        const toDate = (dateRange.to || dateRange.from).toISOString();
        
        // Step 1: Fetch all trainers for this branch (single query)
        const { data: trainers, error: trainersError } = await supabase
          .from('trainers')
          .select('id, first_name, last_name')
          .eq('branch_id', branchId);
          
        if (trainersError) {
          throw new Error(`Error fetching trainers: ${trainersError.message}`);
        }
        
        if (!trainers?.length) return [];
        
        const trainerIds = trainers.map(t => t.id);
        
        // Step 2: Fetch all schedules for all trainers at once (single query)
        const { data: allSchedules, error: schedulesError } = await supabase
          .from('class_schedules')
          .select('id, trainer_id, classes(id, name, trainer_fee_value, trainer_fee_type)')
          .in('trainer_id', trainerIds);
          
        if (schedulesError) {
          console.error('Error fetching schedules:', schedulesError);
          throw schedulesError;
        }
        
        // Create schedule lookup by trainer
        const schedulesByTrainer = new Map<string, typeof allSchedules>();
        allSchedules?.forEach(schedule => {
          const existing = schedulesByTrainer.get(schedule.trainer_id) || [];
          existing.push(schedule);
          schedulesByTrainer.set(schedule.trainer_id, existing);
        });
        
        const allScheduleIds = allSchedules?.map(s => s.id) || [];
        
        if (allScheduleIds.length === 0) {
          // No schedules, return trainers with zero values
          return trainers.map(trainer => ({
            id: trainer.id,
            trainerName: `${trainer.first_name} ${trainer.last_name}`,
            totalEarned: 0,
            allocatedAmount: 0,
            paidAmount: 0,
            pendingAmount: 0,
            classesCount: 0,
            clients: 0
          }));
        }
        
        // Step 3: Fetch all bookings for all schedules at once (single query)
        const { data: allBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, client_id, class_schedule_id, payment_status')
          .in('class_schedule_id', allScheduleIds)
          .gte('created_at', fromDate)
          .lte('created_at', toDate);
          
        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
          throw bookingsError;
        }
        
        // Create booking lookup by schedule
        const bookingsBySchedule = new Map<string, typeof allBookings>();
        allBookings?.forEach(booking => {
          const existing = bookingsBySchedule.get(booking.class_schedule_id) || [];
          existing.push(booking);
          bookingsBySchedule.set(booking.class_schedule_id, existing);
        });
        
        const allBookingIds = allBookings?.map(b => b.id) || [];
        
        // Step 4: Fetch all invoice items for all bookings at once (single query)
        let allInvoiceItems: any[] = [];
        if (allBookingIds.length > 0) {
          const { data: invoiceItems, error: itemsError } = await supabase
            .from('invoice_items')
            .select(`
              id,
              amount,
              description,
              item_type,
              booking_id,
              invoice_id,
              invoices:invoice_id (
                id, 
                status,
                payment_date
              )
            `)
            .in('booking_id', allBookingIds);
            
          if (itemsError) {
            console.error('Error fetching invoice items:', itemsError);
            throw itemsError;
          }
          
          allInvoiceItems = invoiceItems || [];
        }
        
        // Create invoice items lookup by booking
        const invoiceItemsByBooking = new Map<string, typeof allInvoiceItems>();
        allInvoiceItems.forEach(item => {
          if (item.booking_id) {
            const existing = invoiceItemsByBooking.get(item.booking_id) || [];
            existing.push(item);
            invoiceItemsByBooking.set(item.booking_id, existing);
          }
        });
        
        // Step 5: Process each trainer using pre-fetched data (no additional queries!)
        const trainersWithPayments = trainers.map(trainer => {
          const schedules = schedulesByTrainer.get(trainer.id) || [];
          
          if (schedules.length === 0) {
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
          
          // Collect bookings for this trainer's schedules
          const bookings: typeof allBookings = [];
          scheduleIds.forEach(scheduleId => {
            const scheduleBookings = bookingsBySchedule.get(scheduleId) || [];
            bookings.push(...scheduleBookings);
          });
          
          if (bookings.length === 0) {
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
          
          const uniqueClients = new Set(bookings.map(b => b.client_id)).size;
          
          // Collect invoice items for this trainer's bookings
          const invoiceItems: typeof allInvoiceItems = [];
          bookings.forEach(booking => {
            const bookingItems = invoiceItemsByBooking.get(booking.id) || [];
            invoiceItems.push(...bookingItems);
          });
          
          if (invoiceItems.length === 0) {
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
          
          // Filter to only active invoice items (not cancelled) and exclude enrollment fees
          const activeItems = invoiceItems.filter(item => 
            item.invoices && item.invoices.status !== 'cancelled'
          );
          
          const courseFeeItems = activeItems.filter(item => !isEnrollmentFeeItem(item));
          
          const totalRevenue = courseFeeItems.reduce(
            (sum, item) => sum + (item.amount || 0), 0
          );
          
          // Calculate trainer's allocated amount
          let allocatedAmount = 0;
          for (const item of courseFeeItems) {
            if (!item.booking_id) continue;
            
            const booking = bookings.find(b => b.id === item.booking_id);
            if (!booking) continue;
            
            const schedule = schedules.find(s => s.id === booking.class_schedule_id);
            if (!schedule || !schedule.classes) continue;
            
            const feeType = schedule.classes.trainer_fee_type;
            const feeValue = schedule.classes.trainer_fee_value;
            
            if (feeType === 'percentage') {
              allocatedAmount += (item.amount || 0) * (feeValue / 100);
            } else if (feeType === 'fixed') {
              allocatedAmount += feeValue;
            }
          }
          
          if (allocatedAmount === 0 && totalRevenue > 0) {
            allocatedAmount = totalRevenue * 0.7;
          }
          
          // Calculate paid amount from paid invoices
          const paidCourseFeeItems = courseFeeItems.filter(
            item => item.invoices?.status === 'paid'
          );
          
          let paidAmount = 0;
          for (const item of paidCourseFeeItems) {
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
          
          if (paidAmount === 0 && paidCourseFeeItems.length > 0) {
            paidAmount = paidCourseFeeItems.reduce((sum, item) => sum + (item.amount || 0), 0) * 0.7;
          }
          
          return {
            id: trainer.id,
            trainerName: `${trainer.first_name} ${trainer.last_name}`,
            totalEarned: totalRevenue,
            allocatedAmount: allocatedAmount,
            paidAmount: paidAmount,
            pendingAmount: allocatedAmount - paidAmount,
            classesCount: schedules.length,
            clients: uniqueClients
          };
        });
        
        return trainersWithPayments
          .filter(Boolean)
          .sort((a, b) => b!.totalEarned - a!.totalEarned);
          
      } catch (error) {
        console.error("Error fetching trainer payment data:", error);
        throw error;
      }
    },
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000
  });

  if (isLoading || isLoadingTrainers) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Trainer Payment Report</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-36">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!trainers || trainers.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Trainer Payment Report</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground py-4">No trainer payment data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Trainer Payment Report</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trainer</TableHead>
              <TableHead className="text-right">Course Fee Revenue</TableHead>
              <TableHead className="text-right">Allocated</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead className="text-center">Classes</TableHead>
              <TableHead className="text-center">Clients</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainers.map((trainer) => (
              <TableRow key={trainer.id}>
                <TableCell className="font-medium">{trainer.trainerName}</TableCell>
                <TableCell className="text-right">{formatCurrency(trainer.totalEarned)}</TableCell>
                <TableCell className="text-right">{formatCurrency(trainer.allocatedAmount)}</TableCell>
                <TableCell className="text-right">{formatCurrency(trainer.paidAmount)}</TableCell>
                <TableCell className="text-right">{formatCurrency(trainer.pendingAmount)}</TableCell>
                <TableCell className="text-center">{trainer.classesCount}</TableCell>
                <TableCell className="text-center">{trainer.clients}</TableCell>
                <TableCell className="text-right">
                  {trainer.pendingAmount > 0 ? (
                    <ExtendedBadge variant="amber">Payment Due</ExtendedBadge>
                  ) : (
                    <ExtendedBadge variant="green">Paid</ExtendedBadge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
