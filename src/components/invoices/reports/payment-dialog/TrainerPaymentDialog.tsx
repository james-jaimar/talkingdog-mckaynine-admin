
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogHeader as PaymentDialogHeader } from "./DialogHeader";
import { ClassTable } from "./ClassTable";
import { PaymentTracker } from "./PaymentTracker";
import { PaymentDetailsPanel } from "./PaymentDetailsPanel";
import { DialogFooter } from "./DialogFooter";
import { LoadingState } from "./LoadingState";
import { useTrainerPaymentData } from "./useTrainerPaymentData";
import { useMarkTrainerPaymentsPaid } from "@/hooks/useMarkTrainerPaymentsPaid";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PaymentDetailsForm, PaymentDetailsFormValues } from "./PaymentDetailsForm";

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
  const isMobile = useIsMobile();

  // Reset selected classes when the dialog opens with new scheduleIds
  useEffect(() => {
    if (open && scheduleIds.length > 0) {
      setSelectedClassIds(scheduleIds);
    }
  }, [open, scheduleIds]);

  const { data, isLoading, error, trainerData } = useTrainerPaymentData(
    trainerId, 
    branchId, 
    selectedClassIds, 
    dateRange
  );

  const markAsPaid = useMarkTrainerPaymentsPaid();

  const handleToggleClass = (scheduleId: string, checked: boolean) => {
    if (checked) {
      setSelectedClassIds(prev => [...prev, scheduleId]);
    } else {
      setSelectedClassIds(prev => prev.filter(id => id !== scheduleId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.classes) {
      setSelectedClassIds(data.classes.map(c => c.scheduleId));
    } else {
      setSelectedClassIds([]);
    }
  };

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
    { className: "max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" };

  return (
    <DialogComponent open={open} onOpenChange={onOpenChange}>
      <DialogContentComponent {...contentProps}>
        <DialogHeaderComponent>
          <DialogTitleComponent>Record Trainer Payment</DialogTitleComponent>
        </DialogHeaderComponent>
        
        <ScrollArea className="flex-1 px-1">
          <div className="space-y-6 py-4">
            {isLoading ? (
              <LoadingState />
            ) : (
              <>
                <PaymentDialogHeader 
                  trainerName={trainerData?.trainerName || "Trainer"} 
                  totalAmount={data?.totalAmount || 0}
                  classCount={selectedClassIds.length}
                />
                
                {data?.classes && data.classes.length > 0 ? (
                  <ClassTable 
                    classes={data.classes}
                    selectedClassIds={selectedClassIds}
                    onToggleClass={handleToggleClass}
                    onSelectAll={handleSelectAll}
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
                      totalCount={data?.classes?.length || 0}
                      amount={data?.selectedAmount || 0}
                    />
                    
                    <PaymentDetailsForm 
                      onSubmit={handleSubmitPayment} 
                      isPending={markAsPaid.isPending}
                      trainerEmail={trainerData?.email}
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
