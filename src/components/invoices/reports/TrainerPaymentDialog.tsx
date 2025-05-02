
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTrainerPaymentData } from "@/hooks/useTrainerPaymentData";
import { useMarkTrainerPaymentsPaid } from "@/hooks/useMarkTrainerPaymentsPaid";
import { PaymentDetailsForm, PaymentDetailsFormValues } from "./payment-dialog/PaymentDetailsForm";
import { Button } from "@/components/ui/button";
import { TrainerClassSelector } from "./payment-dialog/TrainerClassSelector";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { AlertDialogAction } from "@/components/ui/alert-dialog";

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
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>(scheduleIds);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsFormValues>({
    paymentMethod: 'bank_transfer',
    transactionId: '',
    paymentNotes: '',
    sendEmail: false
  });
  
  // Get trainer data to display classes for selection
  const { data: trainerData, isLoading } = useTrainerPaymentData(branchId, dateRange);
  const trainer = trainerData?.find(t => t.id === trainerId);
  
  // Mark payments as paid mutation
  const markAsPaid = useMarkTrainerPaymentsPaid();

  // Reset selection when dialog opens/trainer changes
  useEffect(() => {
    if (open && trainerId) {
      setSelectedScheduleIds(scheduleIds);
    }
  }, [open, trainerId, scheduleIds]);

  const handleSubmitPayment = async () => {
    if (selectedScheduleIds.length === 0) {
      toast.warning("Please select at least one class for payment");
      return;
    }

    if (!paymentDetails.paymentMethod) {
      toast.warning("Please select a payment method");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Find the selected classes from the trainer data
      const selectedClasses = trainer?.classDetails?.filter(
        cls => selectedScheduleIds.includes(cls.scheduleId)
      ) || [];

      await markAsPaid.mutateAsync({
        trainerId,
        scheduleIds: selectedScheduleIds,
        paymentMethod: paymentDetails.paymentMethod,
        transactionId: paymentDetails.transactionId,
        notes: paymentDetails.paymentNotes,
        sendEmail: paymentDetails.sendEmail,
        trainerName: trainer?.trainerName,
        trainerEmail: trainer?.trainerEmail,
        classDetails: selectedClasses,
        documentUrl: paymentDetails.documentUrl,
        documentName: paymentDetails.documentName
      });
      
      // Close dialog after successful payment
      onOpenChange(false);
    } catch (error) {
      console.error("Error processing payment:", error);
      // Toast is handled by the mutation
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleSchedule = (scheduleId: string) => {
    setSelectedScheduleIds(prev => 
      prev.includes(scheduleId)
        ? prev.filter(id => id !== scheduleId)
        : [...prev, scheduleId]
    );
  };

  const handleToggleAll = () => {
    if (!trainer?.classDetails) return;
    
    const unpaidClasses = trainer.classDetails.filter(cls => !cls.isPaid);
    
    if (selectedScheduleIds.length === unpaidClasses.length) {
      // If all are selected, deselect all
      setSelectedScheduleIds([]);
    } else {
      // Otherwise select all unpaid
      setSelectedScheduleIds(unpaidClasses.map(c => c.scheduleId));
    }
  };
  
  const handleFormChange = (values: PaymentDetailsFormValues) => {
    setPaymentDetails(values);
  };

  // Calculate total payment amount
  const selectedClassDetails = trainer?.classDetails?.filter(
    cls => selectedScheduleIds.includes(cls.scheduleId)
  ) || [];
  
  const totalAmount = selectedClassDetails.reduce(
    (sum, cls) => sum + cls.potentialRevenue, 0
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Process Payment for {trainer?.trainerName}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !trainer ? (
          <div className="text-center py-4 text-muted-foreground">
            Trainer information not found
          </div>
        ) : (
          <div className="space-y-6">
            <TrainerClassSelector 
              classes={trainer.classDetails || []} 
              selectedIds={selectedScheduleIds}
              onToggleClass={handleToggleSchedule}
              onToggleAll={handleToggleAll}
              isDisabled={isProcessing}
            />
            
            <Separator />
            
            <PaymentDetailsForm 
              onChange={handleFormChange} 
              values={paymentDetails}
              isDisabled={isProcessing}
              includeEmailOption={true}
              onSubmit={handleSubmitPayment}
              trainerEmail={trainer.trainerEmail}
            />
            
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
              <div className="text-lg font-semibold">
                Total Payment: {new Intl.NumberFormat('en-ZA', { 
                  style: 'currency', 
                  currency: 'ZAR',
                  currencyDisplay: 'narrowSymbol'
                }).format(totalAmount)}
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                
                <AlertDialogAction asChild>
                  <Button 
                    onClick={handleSubmitPayment}
                    disabled={isProcessing || selectedScheduleIds.length === 0}
                    className="gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Process Payment
                      </>
                    )}
                  </Button>
                </AlertDialogAction>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
