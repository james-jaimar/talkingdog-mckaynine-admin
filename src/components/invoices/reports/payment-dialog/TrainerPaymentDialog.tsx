
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMarkTrainerPaymentsPaid } from "@/hooks/useMarkTrainerPaymentsPaid";
import { PaymentDialogHeader } from "./DialogHeader";
import { PaymentDialogFooter } from "./DialogFooter";
import { ClassTable } from "./ClassTable";
import { LoadingState } from "./LoadingState";
import { useTrainerPaymentData } from "./useTrainerPaymentData";
import { TrainerPaymentDialogProps } from "./types";
import { PaymentDetailsForm, PaymentDetailsFormValues } from "./PaymentDetailsForm";
import { PaymentTracker } from "./PaymentTracker";
import { generateTrainerPaymentPDF } from "../pdf/TrainerPaymentPDF";
import { sendTrainerPaymentEmail } from "@/lib/emails/trainerPaymentEmail";
import { PaymentDetailsPanel } from "./PaymentDetailsPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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
    trainerEmail, 
    classDetails, 
    selectedClasses, 
    toggleSelectAll, 
    toggleClass 
  } = useTrainerPaymentData(open, trainerId, branchId, dateRange);

  const [processStep, setProcessStep] = useState<'select' | 'details' | 'processing'>('select');
  const [paymentStep, setPaymentStep] = useState<'processing' | 'pdf' | 'email' | 'database' | 'complete'>('processing');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsFormValues | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const markAsPaid = useMarkTrainerPaymentsPaid();
  
  // Calculate if all unpaid classes are selected
  const unpaidClasses = classDetails.filter(c => !c.isPaid);
  const allUnpaidSelected = 
    selectedClasses.length > 0 && 
    selectedClasses.length === unpaidClasses.length;
  const hasUnpaidClasses = unpaidClasses.length > 0;

  const handleSelectPaymentDetails = async (details: PaymentDetailsFormValues) => {
    setPaymentDetails(details);
    setProcessStep('processing');
    await processPayment(details);
  };
  
  const handleMarkAsPaid = () => {
    if (selectedClasses.length === 0) return;
    setProcessStep('details');
  };
  
  const handleBackToSelection = () => {
    setProcessStep('select');
    setPaymentDetails(null);
    setPdfUrl(null);
  };

  const processPayment = async (details: PaymentDetailsFormValues) => {
    try {
      setPaymentStep('processing');
      
      // Small delay to show processing step
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate PDF
      setPaymentStep('pdf');
      const pdf = await generateTrainerPaymentPDF({
        trainerName,
        trainerEmail: trainerEmail || 'No email provided',
        classes: classDetails.filter(c => selectedClasses.includes(c.scheduleId)),
        paymentDetails: details,
        paymentDate: new Date().toISOString()
      });
      setPdfUrl(pdf);
      
      // Send email if requested
      if (details.sendEmail && trainerEmail) {
        setPaymentStep('email');
        await sendTrainerPaymentEmail({
          to: trainerEmail,
          trainerName,
          pdfAttachment: pdf,
          amount: classDetails
            .filter(c => selectedClasses.includes(c.scheduleId))
            .reduce((sum, c) => sum + c.potentialRevenue, 0),
          paymentDetails: details
        });
      }
      
      // Update database
      setPaymentStep('database');
      await markAsPaid.mutateAsync({
        trainerId,
        scheduleIds: selectedClasses,
        paymentMethod: details.paymentMethod,
        transactionId: details.transactionId || null,
        notes: details.paymentNotes || null
      });
      
      // Complete
      setPaymentStep('complete');
      
      // Wait a moment then close the dialog
      setTimeout(() => {
        onOpenChange(false);
        toast.success("Payment completed and records updated");
      }, 1500);
      
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Error processing payment");
      setProcessStep('details');
    }
  };

  // Determine content based on current step
  const renderDialogContent = () => {
    if (processStep === 'select') {
      return (
        <>
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
        </>
      );
    } else if (processStep === 'details') {
      return (
        <>
          <div className="mb-4">
            <Button 
              variant="ghost" 
              onClick={handleBackToSelection} 
              className="p-0 h-8"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to class selection
            </Button>
          </div>
          
          <h2 className="text-xl font-semibold mb-1">Payment Details</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Enter payment information for {trainerName}
          </p>
          
          <PaymentDetailsPanel 
            classDetails={classDetails.filter(c => selectedClasses.includes(c.scheduleId))}
          />
          
          <div className="mt-6">
            <PaymentDetailsForm 
              onSubmit={handleSelectPaymentDetails}
              isPending={markAsPaid.isPending}
              trainerEmail={trainerEmail}
            />

            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                onClick={handleBackToSelection} 
                className="mr-2"
                disabled={markAsPaid.isPending}
              >
                Back
              </Button>
              <Button 
                onClick={() => {
                  const formValues = {
                    paymentMethod: "bank_transfer",
                    transactionId: "",
                    paymentNotes: "",
                    sendEmail: false
                  } as PaymentDetailsFormValues;
                  handleSelectPaymentDetails(formValues);
                }}
                disabled={markAsPaid.isPending}
              >
                Complete Payment
              </Button>
            </div>
          </div>
        </>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <h2 className="text-xl font-semibold mb-6">Processing Payment</h2>
          
          <PaymentTracker 
            step={paymentStep} 
            sendEmail={paymentDetails?.sendEmail || false} 
          />
          
          {paymentStep === 'complete' && (
            <div className="text-center mt-4">
              <p className="text-green-600 font-medium">Payment successfully processed!</p>
              <p className="text-sm text-muted-foreground mt-2">
                This dialog will close automatically...
              </p>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
