
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrainerClassSelector } from "./payment-dialog/TrainerClassSelector";
import { PaymentDetailsForm, PaymentDetailsValues } from "./payment-dialog/PaymentDetailsForm";
import { useTrainerPaymentData } from "@/hooks/useTrainerPaymentData";
import { useMarkTrainerPaymentsPaid } from "@/hooks/useMarkTrainerPaymentsPaid";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface TrainerPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainerId: string;
  scheduleIds?: string[];
  branchId?: string;
  dateRange: { from: Date; to: Date };
}

export function TrainerPaymentDialog({
  open,
  onOpenChange,
  trainerId,
  scheduleIds = [],
  branchId,
  dateRange
}: TrainerPaymentDialogProps) {
  const [selectedTab, setSelectedTab] = useState<string>("classes");
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsValues>({
    paymentMethod: 'bank_transfer',
    sendEmail: true
  });
  const [hasSelectedClasses, setHasSelectedClasses] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const { data: trainersData, isLoading: isLoadingTrainers } = useTrainerPaymentData(branchId, dateRange);
  const markTrainerPaymentsPaid = useMarkTrainerPaymentsPaid();

  // Get the trainer data
  const trainer = trainersData?.find(t => t.id === trainerId);
  
  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      // Pre-select unpaid classes from the provided scheduleIds
      if (trainer?.classDetails) {
        const validScheduleIds = scheduleIds.filter(id => 
          trainer.classDetails?.some(cls => cls.scheduleId === id && !cls.isPaid)
        );
        setSelectedScheduleIds(validScheduleIds);
      } else {
        setSelectedScheduleIds([]);
      }
      
      setPaymentDetails({
        paymentMethod: 'bank_transfer',
        sendEmail: true
      });
      setSelectedTab("classes");
    }
  }, [open, trainer, scheduleIds]);

  // Calculate total amount and check if any classes are selected
  useEffect(() => {
    if (!trainer?.classDetails) {
      setTotalAmount(0);
      setHasSelectedClasses(false);
      return;
    }

    const selectedClasses = trainer.classDetails.filter(
      cls => selectedScheduleIds.includes(cls.scheduleId)
    );
    
    const total = selectedClasses.reduce(
      (sum, cls) => sum + cls.potentialRevenue, 
      0
    );
    
    setTotalAmount(total);
    setHasSelectedClasses(selectedClasses.length > 0);
  }, [selectedScheduleIds, trainer]);

  const toggleClassSelection = (scheduleId: string) => {
    setSelectedScheduleIds(prev => 
      prev.includes(scheduleId) 
        ? prev.filter(id => id !== scheduleId) 
        : [...prev, scheduleId]
    );
  };

  const toggleAllUnpaid = () => {
    if (!trainer?.classDetails) return;

    const unpaidClasses = trainer.classDetails.filter(cls => !cls.isPaid);
    const unpaidIds = unpaidClasses.map(cls => cls.scheduleId);
    
    const allSelected = unpaidClasses.every(cls => 
      selectedScheduleIds.includes(cls.scheduleId)
    );
    
    if (allSelected) {
      setSelectedScheduleIds([]);
    } else {
      setSelectedScheduleIds(unpaidIds);
    }
  };

  const handlePaymentDetailsChange = (values: PaymentDetailsValues) => {
    setPaymentDetails(values);
  };

  const handleMarkAsPaid = async () => {
    if (!trainer || selectedScheduleIds.length === 0) {
      toast.error("No classes selected for payment");
      return;
    }

    try {
      await markTrainerPaymentsPaid.mutateAsync({
        trainerId,
        scheduleIds: selectedScheduleIds,
        paymentMethod: paymentDetails.paymentMethod || 'bank_transfer',
        transactionId: paymentDetails.transactionId,
        notes: paymentDetails.paymentNotes,
        sendEmail: paymentDetails.sendEmail,
        documentUrl: paymentDetails.documentUrl,
        documentName: paymentDetails.documentName,
        trainerName: trainer.trainerName,
        trainerEmail: trainer.trainerEmail,
        classDetails: trainer.classDetails?.filter(c => 
          selectedScheduleIds.includes(c.scheduleId)
        )
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating payments:", error);
      // Toast is already shown in the mutation error handler
    }
  };
  
  const isSubmitting = markTrainerPaymentsPaid.isPending;
  const isLoadingData = isLoadingTrainers || !trainer;
  const canProceed = hasSelectedClasses && !!paymentDetails.paymentMethod && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Trainer Payment</DialogTitle>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !trainer ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Trainer not found</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">{trainer.trainerName}</h3>
                {trainer.trainerEmail && (
                  <p className="text-sm text-muted-foreground">
                    {trainer.trainerEmail}
                  </p>
                )}
              </div>

              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="classes" className="flex-1">
                    Select Classes
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="flex-1" disabled={!hasSelectedClasses}>
                    Payment Details
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="classes" className="py-4">
                  <TrainerClassSelector 
                    classes={trainer.classDetails || []}
                    selectedIds={selectedScheduleIds}
                    onToggleClass={toggleClassSelection}
                    onToggleAll={toggleAllUnpaid}
                    isDisabled={isSubmitting}
                  />
                  
                  {selectedScheduleIds.length > 0 && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Classes selected:</span>
                        <span>{selectedScheduleIds.length}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total amount:</span>
                        <span>R {totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="payment" className="py-4">
                  <PaymentDetailsForm
                    values={paymentDetails}
                    onChange={handlePaymentDetailsChange}
                    isDisabled={isSubmitting}
                    includeEmailOption={true}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              {selectedTab === "classes" ? (
                <Button 
                  type="button" 
                  onClick={() => setSelectedTab("payment")} 
                  disabled={!hasSelectedClasses || isSubmitting}
                >
                  Continue to Payment Details
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleMarkAsPaid}
                  disabled={!canProceed}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Process Payment (R {totalAmount.toFixed(2)})
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
