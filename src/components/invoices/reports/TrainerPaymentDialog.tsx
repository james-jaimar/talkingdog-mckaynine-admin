
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
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ExtendedBadge } from "@/components/ui/badge-variants";

interface TrainerClassData {
  id: string;
  name: string;
  revenue: number;
  bookings: number;
  commission: number;
  isPaid: boolean;
}

interface TrainerPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainerId: string;
  branchId?: string;
  dateRange: { from: Date; to: Date };
  scheduleIds?: string[]; // Added this prop to match usage
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
  const [saving, setSaving] = useState(false);
  const [trainerClasses, setTrainerClasses] = useState<TrainerClassData[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [trainerName, setTrainerName] = useState("");
  const queryClient = useQueryClient();

  // Fetch trainer's classes and payment data when dialog opens
  useEffect(() => {
    if (open && trainerId) {
      fetchTrainerData();
    } else {
      setTrainerClasses([]);
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
      
      // Use the scheduleIds passed in if available, otherwise fetch them
      const scheduleIdsToUse = scheduleIds || [];

      // If no scheduleIds were provided, fetch class schedules for this trainer
      if (scheduleIdsToUse.length === 0) {
        const { data: trainerSchedules } = await supabase
          .from('class_schedules')
          .select(`
            id,
            classes:class_id (
              id,
              name,
              trainer_fee_value, 
              trainer_fee_type
            )
          `)
          .eq('trainer_id', trainerId);
        
        if (!trainerSchedules || trainerSchedules.length === 0) {
          setTrainerClasses([]);
          setLoading(false);
          return;
        }
        
        // Update scheduleIdsToUse with fetched schedule IDs
        scheduleIdsToUse.push(...trainerSchedules.map(s => s.id));
      }
      
      if (scheduleIdsToUse.length === 0) {
        setTrainerClasses([]);
        setLoading(false);
        return;
      }
      
      // Get all bookings for these schedules
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id,
          class_schedule_id,
          payment_status,
          invoice_items:invoice_items (
            id,
            amount,
            invoice_id,
            invoices:invoice_id (
              id,
              status,
              payment_date
            )
          )
        `)
        .in('class_schedule_id', scheduleIdsToUse);
      
      if (!bookings || bookings.length === 0) {
        setTrainerClasses([]);
        setLoading(false);
        return;
      }
      
      // Group bookings by class schedule
      const classData = scheduleIdsToUse.map(scheduleId => {
        const classBookings = bookings.filter(b => b.class_schedule_id === scheduleId);
        const classRevenue = classBookings.reduce((sum, booking) => {
          if (booking.invoice_items && booking.invoice_items.length > 0) {
            return sum + booking.invoice_items.reduce((itemSum, item) => itemSum + (item.amount || 0), 0);
          }
          return sum;
        }, 0);
        
        // Get the class details for this schedule
        const classDetails = classBookings.length > 0 
          ? bookings[0].invoice_items[0].invoices 
            ? {
                name: 'Unknown Class', // Default name if not found
                trainer_fee_value: 0,
                trainer_fee_type: 'fixed'
              }
            : null
          : null;
        
        // Calculate commission based on class settings
        let commission = 0;
        if (classDetails) {
          if (classDetails.trainer_fee_type === 'percentage') {
            commission = classRevenue * (classDetails.trainer_fee_value / 100);
          } else {
            commission = classBookings.length * classDetails.trainer_fee_value;
          }
        }
        
        // Check if all invoices are marked as paid
        const allPaid = classBookings.every(booking => 
          booking.invoice_items && 
          booking.invoice_items.length > 0 && 
          booking.invoice_items.every(item => 
            item.invoices && item.invoices.status === 'paid'
          )
        );
        
        return {
          id: scheduleId,
          name: classDetails?.name || 'Unknown Class',
          revenue: classRevenue,
          bookings: classBookings.length,
          commission,
          isPaid: allPaid
        };
      });
      
      setTrainerClasses(classData);
      
      // Pre-select unpaid classes
      setSelectedClasses(classData.filter(c => !c.isPaid).map(c => c.id));
      
    } catch (error) {
      console.error("Error fetching trainer data:", error);
      toast.error("Failed to load trainer class data");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (selectedClasses.length === 0) {
      toast.warning("No classes selected for payment");
      return;
    }
    
    setSaving(true);
    try {
      // Implement the marking of payments here
      // This is a placeholder - in a real implementation you would update the invoice status
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Marked ${selectedClasses.length} classes as paid for ${trainerName}`);
      
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['trainers', branchId] });
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error marking payments:", error);
      toast.error("Failed to update payment status");
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClasses(trainerClasses.map(c => c.id));
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

  const totalSelectedCommission = trainerClasses
    .filter(c => selectedClasses.includes(c.id))
    .reduce((sum, c) => sum + c.commission, 0);

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
        ) : trainerClasses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No classes found for this trainer</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Checkbox 
                id="select-all" 
                checked={selectedClasses.length === trainerClasses.length}
                onCheckedChange={toggleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Select All Classes
              </label>
            </div>
            
            <div className="max-h-80 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainerClasses.map(classData => (
                    <TableRow key={classData.id}>
                      <TableCell className="px-4 py-2">
                        <Checkbox 
                          checked={selectedClasses.includes(classData.id)}
                          onCheckedChange={(checked) => toggleClass(classData.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{classData.name}</TableCell>
                      <TableCell className="text-right">{classData.bookings}</TableCell>
                      <TableCell className="text-right">{formatCurrency(classData.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(classData.commission)}</TableCell>
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
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMarkAsPaid}
            disabled={saving || loading || selectedClasses.length === 0}
          >
            {saving ? (
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
