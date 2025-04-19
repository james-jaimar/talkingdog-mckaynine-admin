
import { useState, useEffect } from "react";
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

interface TrainerPaymentReportProps {
  branchId?: string;
  dateRange: { from: Date; to?: Date };
  isLoading: boolean;
}

export function TrainerPaymentReport({ branchId, dateRange, isLoading }: TrainerPaymentReportProps) {
  // Use React Query to fetch real trainer payment data
  const { data: trainers = [], isLoading: isLoadingTrainers } = useQuery({
    queryKey: ['trainer-payments', branchId, dateRange],
    queryFn: async () => {
      if (!branchId) return [];
      
      try {
        // Format date range for query
        const fromDate = dateRange.from.toISOString();
        const toDate = (dateRange.to || dateRange.from).toISOString();
        
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
            .in('class_schedule_id', scheduleIds)
            .gte('created_at', fromDate)
            .lte('created_at', toDate);
            
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
              <TableHead className="text-right">Total Revenue</TableHead>
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
