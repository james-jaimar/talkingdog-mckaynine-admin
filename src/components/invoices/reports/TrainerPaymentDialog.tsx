
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/formatters";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { useMarkTrainerPaymentsPaid } from "@/hooks/useMarkTrainerPaymentsPaid";
import { TrainerClassDetail } from "@/hooks/useTrainerPaymentData";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface TrainerPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainerId: string;
  branchId?: string;
  dateRange: { from: Date; to: Date };
  scheduleIds?: string[];
}

export function TrainerPaymentDialog({
  open,
  onOpenChange,
  trainerId,
  branchId,
  dateRange,
  scheduleIds,
}: TrainerPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [trainerName, setTrainerName] = useState("");
  const [classDetails, setClassDetails] = useState<TrainerClassDetail[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const markAsPaid = useMarkTrainerPaymentsPaid();

  // Fetch trainer's classes and payment data when dialog opens
  useEffect(() => {
    if (open && trainerId) {
      fetchTrainerData();
    } else {
      setClassDetails([]);
      setSelectedClasses([]);
    }
  }, [open, trainerId, branchId]);

  const fetchTrainerData = async () => {
    if (!trainerId || !branchId) return;
    
    setLoading(true);
    try {
      // First get trainer name
      const { data: trainerData } = await supabase
        .from('trainers')
        .select('first_name, last_name')
        .eq('id', trainerId)
        .single();
      
      if (trainerData) {
        setTrainerName(`${trainerData.first_name} ${trainerData.last_name}`);
      }

      // Get the trainer payments data from the query cache
      // Fix: Don't use 'new' with useQueryClient
      const cachedData = queryClient.getQueryData(['trainer-payments', branchId, dateRange]) as any[];
      
      if (cachedData) {
        const trainerData = cachedData.find(t => t.id === trainerId);
        if (trainerData && trainerData.classDetails) {
          setClassDetails(trainerData.classDetails);
          
          // Pre-select unpaid classes
          setSelectedClasses(
            trainerData.classDetails
              .filter(c => !c.isPaid)
              .map(c => c.scheduleId)
          );
          setLoading(false);
          return;
        }
      }

      // If we didn't find cached data, fetch data directly
      const { data: schedules } = await supabase
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
          ),
          bookings:bookings!class_schedule_id (
            id,
            invoice_items:invoice_items!booking_id (
              id,
              amount,
              invoice_id,
              invoices:invoice_id (
                id,
                status
              )
            )
          )
        `)
        .eq('trainer_id', trainerId)
        .gte('start_time', dateRange.from.toISOString())
        .lte('start_time', dateRange.to.toISOString())
        .order('start_time');

      if (!schedules || schedules.length === 0) {
        setClassDetails([]);
        setLoading(false);
        return;
      }

      // Get trainer payments to determine which are already paid
      const { data: trainerPayments } = await supabase
        .from('trainer_payments')
        .select('class_schedule_id, status')
        .eq('trainer_id', trainerId)
        .in('class_schedule_id', schedules.map(s => s.id));

      // Process class details
      const details: TrainerClassDetail[] = schedules.map(schedule => {
        // Check if this schedule is already paid
        const payment = trainerPayments?.find(p => 
          p.class_schedule_id === schedule.id && p.status === 'paid'
        );
        const isPaid = !!payment;
        
        // Calculate revenue for this class
        let revenue = 0;
        let bookingsCount = 0;
        
        if (schedule.bookings && schedule.bookings.length > 0) {
          bookingsCount = schedule.bookings.length;
          
          for (const booking of schedule.bookings) {
            if (!booking.invoice_items || booking.invoice_items.length === 0) continue;
            
            for (const item of booking.invoice_items) {
              if (!item.invoices || item.invoices.status === 'cancelled') continue;
              
              // Calculate trainer's commission
              if (schedule.classes) {
                const feeType = schedule.classes.trainer_fee_type;
                const feeValue = schedule.classes.trainer_fee_value || 0;
                
                if (feeType === 'percentage') {
                  revenue += (item.amount || 0) * (feeValue / 100);
                } else if (feeType === 'fixed') {
                  revenue += feeValue;
                }
              }
            }
          }
        }
        
        return {
          scheduleId: schedule.id,
          className: schedule.classes?.name || 'Unknown Class',
          classDate: schedule.start_time,
          scheduleDate: new Date(schedule.start_time),
          revenue,
          bookings: bookingsCount,
          isPaid
        };
      });

      setClassDetails(details);
      
      // Pre-select unpaid classes
      setSelectedClasses(details.filter(c => !c.isPaid).map(c => c.scheduleId));
    } catch (error) {
      console.error("Error fetching trainer data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAsPaid = async () => {
    if (selectedClasses.length === 0) {
      return;
    }
    
    try {
      await markAsPaid.mutateAsync({
        trainerId,
        scheduleIds: selectedClasses
      });
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error marking payments:", error);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClasses(classDetails.filter(c => !c.isPaid).map(c => c.scheduleId));
    } else {
      setSelectedClasses([]);
    }
  };

  const toggleClass = (classId: string, checked: boolean) => {
    if (checked) {
      setSelectedClasses(prev => [...prev, classId]);
    } else {
      setSelectedClasses(prev => prev.filter(id => id !== classId));
    }
  };

  const totalSelectedCommission = classDetails
    .filter(c => selectedClasses.includes(c.scheduleId))
    .reduce((sum, c) => sum + c.revenue, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Mark Payments for {trainerName}</DialogTitle>
          <DialogDescription>
            Select classes to mark as paid for this trainer.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : classDetails.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No classes found for this trainer</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Checkbox 
                id="select-all" 
                checked={selectedClasses.length > 0 && selectedClasses.length === classDetails.filter(c => !c.isPaid).length}
                onCheckedChange={toggleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Select All Unpaid Classes
              </label>
            </div>
            
            <div className="max-h-80 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classDetails.map(classData => (
                    <TableRow key={classData.scheduleId}>
                      <TableCell className="px-4 py-2">
                        <Checkbox 
                          checked={selectedClasses.includes(classData.scheduleId)}
                          onCheckedChange={(checked) => toggleClass(classData.scheduleId, !!checked)}
                          disabled={classData.isPaid}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{classData.className}</TableCell>
                      <TableCell>{format(new Date(classData.classDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">{classData.bookings}</TableCell>
                      <TableCell className="text-right">{formatCurrency(classData.revenue)}</TableCell>
                      <TableCell className="text-right">
                        <ExtendedBadge variant={classData.isPaid ? "green" : "amber"}>
                          {classData.isPaid ? "Paid" : "Unpaid"}
                        </ExtendedBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <p className="text-sm font-medium">
                Total Selected: <span className="font-bold">{formatCurrency(totalSelectedCommission)}</span>
              </p>
            </div>
          </>
        )}
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={markAsPaid.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMarkAsPaid}
            disabled={markAsPaid.isPending || loading || selectedClasses.length === 0}
          >
            {markAsPaid.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Mark as Paid'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
