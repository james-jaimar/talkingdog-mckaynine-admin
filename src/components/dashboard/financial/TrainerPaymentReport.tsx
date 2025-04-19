
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

interface TrainerPaymentReportProps {
  branchId?: string;
  dateRange: { from: Date; to?: Date };
  isLoading: boolean;
}

interface TrainerPayment {
  id: string;
  trainerName: string;
  totalEarned: number;
  allocatedAmount: number;
  paidAmount: number;
  pendingAmount: number;
  classesCount: number;
  clients: number;
  lastPaymentDate?: string;
}

export function TrainerPaymentReport({ branchId, dateRange, isLoading }: TrainerPaymentReportProps) {
  const [trainers, setTrainers] = useState<TrainerPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrainerData() {
      if (!branchId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Format date range for query
        const fromDate = dateRange.from.toISOString();
        const toDate = (dateRange.to || dateRange.from).toISOString();
        
        // Get all trainers for this branch
        const { data: branchTrainers, error: trainerError } = await supabase
          .from('trainers')
          .select('id, first_name, last_name')
          .eq('branch_id', branchId);
          
        if (trainerError) {
          console.error("Error fetching trainers:", trainerError);
          setLoading(false);
          return;
        }
        
        const trainerPayments = await Promise.all(branchTrainers.map(async (trainer) => {
          // Get class schedules led by this trainer
          const { data: schedules, error: scheduleError } = await supabase
            .from('class_schedules')
            .select('id, class_id')
            .eq('trainer_id', trainer.id);
            
          if (scheduleError) {
            console.error(`Error fetching schedules for trainer ${trainer.id}:`, scheduleError);
            return null;
          }
          
          const scheduleIds = schedules.map(s => s.id);
          
          // Count unique clients in these classes
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
          
          // Get unique client count
          const uniqueClients = new Set(bookings.map(b => b.client_id)).size;
          
          // Calculate financial data
          // This is simplified - in a real app you'd track actual payments
          const totalEarned = bookings.length * 500; // Assuming R500 per booking
          const paidBookings = bookings.filter(b => b.payment_status === 'paid');
          const paidAmount = paidBookings.length * 500;
          const pendingAmount = totalEarned - paidAmount;
          
          return {
            id: trainer.id,
            trainerName: `${trainer.first_name} ${trainer.last_name}`,
            totalEarned,
            allocatedAmount: totalEarned * 0.7, // 70% of total goes to trainer (example)
            paidAmount: paidAmount * 0.7,
            pendingAmount: pendingAmount * 0.7,
            classesCount: schedules.length,
            clients: uniqueClients,
            lastPaymentDate: paidBookings.length ? new Date().toISOString() : undefined
          };
        }));
        
        // Remove nulls and sort by earnings
        const validTrainers = trainerPayments
          .filter(Boolean)
          .sort((a, b) => b!.totalEarned - a!.totalEarned) as TrainerPayment[];
          
        setTrainers(validTrainers);
      } catch (error) {
        console.error("Error fetching trainer payment data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTrainerData();
  }, [branchId, dateRange]);

  if (loading || isLoading) {
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
