
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PaymentDialogHeader } from "./DialogHeader";
import { ClassTable } from "./ClassTable";
import { PaymentTracker } from "./PaymentTracker";
import { PaymentDetailsForm, PaymentDetailsFormValues } from "./PaymentDetailsForm";
import { DialogFooter } from "./DialogFooter";
import { LoadingState } from "./LoadingState";
import { useMarkTrainerPaymentsPaid } from "@/hooks/useMarkTrainerPaymentsPaid";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/useIsMobile";

interface TrainerPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainerId: string;
  dateRange?: { from: Date; to: Date };
  branchId?: string;
  scheduleIds?: string[];
}

export function TrainerPaymentDialog({
  open,
  onOpenChange,
  trainerId,
  dateRange,
  branchId,
  scheduleIds = []
}: TrainerPaymentDialogProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(scheduleIds || []);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsFormValues>({
    paymentMethod: 'bank_transfer',
    sendEmail: true
  });
  const isMobile = useIsMobile();

  // Reset selected classes when the dialog opens with new scheduleIds
  useEffect(() => {
    if (open && scheduleIds.length > 0) {
      setSelectedClassIds(scheduleIds);
    }
  }, [open, scheduleIds]);

  // Use the custom hook to fetch trainer payment data
  const { 
    loading: isLoading, 
    trainerName, 
    trainerEmail,
    classDetails,
    selectedClasses,
    toggleClass,
    toggleSelectAll
  } = useTrainerPaymentData(open, trainerId, branchId, dateRange);

  const markAsPaid = useMarkTrainerPaymentsPaid();

  // Calculate total amount from selected classes
  const selectedAmount = classDetails
    .filter(c => selectedClassIds.includes(c.scheduleId))
    .reduce((sum, c) => sum + c.potentialRevenue, 0);

  const handleToggleClass = (scheduleId: string, checked: boolean) => {
    if (checked) {
      setSelectedClassIds(prev => [...prev, scheduleId]);
    } else {
      setSelectedClassIds(prev => prev.filter(id => id !== scheduleId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && classDetails) {
      const unpaidScheduleIds = classDetails
        .filter(c => !c.isPaid)
        .map(c => c.scheduleId);
      setSelectedClassIds(unpaidScheduleIds);
    } else {
      setSelectedClassIds([]);
    }
  };

  // Update the payment details to include the total amount for display purposes
  useEffect(() => {
    setPaymentDetails(prev => ({
      ...prev,
      totalAmount: selectedAmount
    }));
  }, [selectedAmount]);

  const handleSubmitPayment = async (paymentDetails: PaymentDetailsFormValues) => {
    if (selectedClassIds.length === 0) {
      toast.error("No classes selected for payment");
      return;
    }

    try {
      await markAsPaid.mutateAsync({
        trainerId,
        scheduleIds: selectedClassIds,
        paymentMethod: paymentDetails.paymentMethod,
        transactionId: paymentDetails.transactionId,
        notes: paymentDetails.paymentNotes,
        sendEmail: paymentDetails.sendEmail,
        documentUrl: paymentDetails.documentUrl,
        documentName: paymentDetails.documentName
      });
      
      toast.success("Payment recorded successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to record payment");
    }
  };

  // Use Sheet component for mobile and Dialog for desktop
  const DialogComponent = isMobile ? Sheet : Dialog;
  const DialogContentComponent = isMobile ? SheetContent : DialogContent;
  const DialogHeaderComponent = isMobile ? SheetHeader : DialogHeader;
  const DialogTitleComponent = isMobile ? SheetTitle : DialogTitle;
  
  // For Sheet (mobile), we need different positioning
  const contentProps = isMobile ? 
    { side: "bottom" as const, className: "h-[90%] pt-6" } : 
    { className: "max-w-3xl h-[90vh] flex flex-col overflow-hidden" };

  // Calculate if all unpaid classes are selected
  const unpaidClassIds = classDetails.filter(c => !c.isPaid).map(c => c.scheduleId);
  const hasUnpaidClasses = unpaidClassIds.length > 0;
  const allUnpaidSelected = unpaidClassIds.length > 0 && 
    unpaidClassIds.every(id => selectedClassIds.includes(id));

  return (
    <DialogComponent open={open} onOpenChange={onOpenChange}>
      <DialogContentComponent {...contentProps}>
        <DialogHeaderComponent>
          <DialogTitleComponent>Record Trainer Payment</DialogTitleComponent>
        </DialogHeaderComponent>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="space-y-6 py-4 px-1">
            {isLoading ? (
              <LoadingState />
            ) : (
              <>
                <PaymentDialogHeader 
                  trainerName={trainerName || "Trainer"} 
                  totalAmount={selectedAmount}
                  classCount={selectedClassIds.length}
                  toggleSelectAll={handleSelectAll}
                  hasUnpaidClasses={hasUnpaidClasses}
                  allUnpaidSelected={allUnpaidSelected}
                />
                
                {classDetails && classDetails.length > 0 ? (
                  <ClassTable 
                    classDetails={classDetails}
                    selectedClasses={selectedClassIds}
                    toggleClass={handleToggleClass}
                  />
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No classes found for this trainer</p>
                  </div>
                )}
                
                {selectedClassIds.length > 0 && (
                  <>
                    <PaymentTracker
                      selectedCount={selectedClassIds.length}
                      totalCount={classDetails?.length || 0}
                      amount={selectedAmount}
                    />
                    
                    <PaymentDetailsForm
                      values={paymentDetails}
                      onChange={setPaymentDetails}
                      onSubmit={handleSubmitPayment}
                      isPending={markAsPaid.isPending}
                      trainerEmail={trainerEmail}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContentComponent>
    </DialogComponent>
  );
}

// Import the hook at the end to avoid circular dependencies
import { useTrainerPaymentData } from "./useTrainerPaymentData";
