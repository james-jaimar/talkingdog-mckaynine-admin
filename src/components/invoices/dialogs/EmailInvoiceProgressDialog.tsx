import { useState, useEffect, useCallback } from "react";
import { Invoice } from "@/types/invoice";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { syncAndGetPDF } from "@/hooks/invoices/useIOSync";

interface EmailInvoiceProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onReady: (pdfBase64: string | undefined) => void;
  onError: (error: string) => void;
}

export function EmailInvoiceProgressDialog({
  open,
  onOpenChange,
  invoice,
  onReady,
  onError,
}: EmailInvoiceProgressDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepMessage, setStepMessage] = useState("Preparing...");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleProgress = useCallback((step: number, message: string) => {
    setCurrentStep(step);
    setStepMessage(message);
  }, []);

  const startSync = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);
    setCurrentStep(0);
    setStepMessage("Preparing...");

    try {
      const result = await syncAndGetPDF(invoice.id, handleProgress);
      
      if (result.success) {
        setStatus("success");
        // Small delay for UX before transitioning
        setTimeout(() => {
          onReady(result.pdfBase64);
        }, 500);
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Unknown error occurred");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(String(err));
    }
  }, [invoice.id, handleProgress, onReady]);

  useEffect(() => {
    if (open) {
      startSync();
    }
  }, [open, startSync]);

  const handleRetry = () => {
    startSync();
  };

  const handleCancel = () => {
    if (status === "error") {
      onError(errorMessage || "Operation cancelled");
    }
    onOpenChange(false);
  };

  const progressValue = (currentStep / 4) * 100;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preparing Invoice Email</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Progress bar */}
          <Progress value={progressValue} className="h-2" />
          
          {/* Status icon and message */}
          <div className="flex flex-col items-center justify-center space-y-4">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">
                  {stepMessage}
                </p>
              </>
            )}
            
            {status === "success" && (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="text-center text-muted-foreground">
                  Ready to send!
                </p>
              </>
            )}
            
            {status === "error" && (
              <>
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="text-center text-muted-foreground">
                  {errorMessage}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleRetry} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </Button>
                </div>
              </>
            )}
          </div>
          
          {/* Step indicators */}
          {status === "loading" && (
            <div className="space-y-2 text-sm">
              <StepIndicator step={1} currentStep={currentStep} label="Check sync status" />
              <StepIndicator step={2} currentStep={currentStep} label="Fetch PDF from InvoicesOnline" />
              <StepIndicator step={3} currentStep={currentStep} label="Prepare email" />
              <StepIndicator step={4} currentStep={currentStep} label="Ready" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StepIndicator({ 
  step, 
  currentStep, 
  label 
}: { 
  step: number; 
  currentStep: number; 
  label: string;
}) {
  const isComplete = currentStep >= step;
  const isCurrent = currentStep === step - 1 || (currentStep === step && step === 4);
  
  return (
    <div className={`flex items-center gap-2 ${isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
      <div className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
        isComplete 
          ? 'bg-primary text-primary-foreground' 
          : isCurrent 
            ? 'border-2 border-primary' 
            : 'border border-muted-foreground'
      }`}>
        {isComplete ? '✓' : step}
      </div>
      <span className={isCurrent ? 'font-medium' : ''}>{label}</span>
    </div>
  );
}
