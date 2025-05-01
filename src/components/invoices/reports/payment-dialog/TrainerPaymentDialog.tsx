
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMarkTrainerPaymentsPaid } from "@/hooks/useMarkTrainerPaymentsPaid";
import { PaymentDialogHeader } from "./DialogHeader";
import { PaymentDialogFooter } from "./DialogFooter";
import { ClassTable } from "./ClassTable";
import { LoadingState } from "./LoadingState";
import { useTrainerPaymentData } from "./useTrainerPaymentData";
import { TrainerPaymentDialogProps } from "./types";

export function TrainerPaymentDialog({
  open,
  onOpenChange,
  trainerId,
  branchId,
  dateRange,
  scheduleIds,
}: TrainerPaymentDialogProps) {
  const { 
    loading, 
    trainerName, 
    classDetails, 
    selectedClasses, 
    toggleSelectAll, 
    toggleClass 
  } = useTrainerPaymentData(open, trainerId, branchId, dateRange);
  
  const markAsPaid = useMarkTrainerPaymentsPaid();
  
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

  // Calculate if all unpaid classes are selected
  const unpaidClasses = classDetails.filter(c => !c.isPaid);
  const allUnpaidSelected = 
    selectedClasses.length > 0 && 
    selectedClasses.length === unpaidClasses.length;
  const hasUnpaidClasses = unpaidClasses.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <PaymentDialogHeader
          trainerName={trainerName}
          toggleSelectAll={toggleSelectAll}
          hasUnpaidClasses={hasUnpaidClasses}
          allUnpaidSelected={allUnpaidSelected}
        />
        
        {loading ? (
          <LoadingState />
        ) : (
          <ClassTable 
            classDetails={classDetails}
            selectedClasses={selectedClasses}
            toggleClass={toggleClass}
          />
        )}
        
        <PaymentDialogFooter
          selectedClasses={selectedClasses}
          classDetails={classDetails}
          isPending={markAsPaid.isPending}
          onCancel={() => onOpenChange(false)}
          onMarkAsPaid={handleMarkAsPaid}
        />
      </DialogContent>
    </Dialog>
  );
}
