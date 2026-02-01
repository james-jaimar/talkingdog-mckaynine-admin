import { useState, useEffect, useCallback, useRef } from "react";
import { Invoice } from "@/types/invoice";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, RefreshCw, Copy } from "lucide-react";
import { syncAndGetPDF } from "@/hooks/invoices/useIOSync";
import { getInvoiceAsBase64 } from "@/components/invoices/pdf/InvoicePDFGenerator";
import { toast } from "sonner";

interface EmailInvoiceProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onReady: (pdfBase64: string) => void;
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
  
  // Track if the component is still mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  const handleProgress = useCallback((step: number, message: string) => {
    if (isMountedRef.current) {
      setCurrentStep(step);
      setStepMessage(message);
    }
  }, []);

  const startSync = useCallback(async () => {
    // Guard: if already unmounted, don't proceed
    if (!isMountedRef.current) {
      console.log('[EmailProgress] Component unmounted, skipping sync');
      return;
    }
    
    setStatus("loading");
    setErrorMessage(null);
    setCurrentStep(0);
    setStepMessage("Preparing...");

    try {
      const result = await syncAndGetPDF(invoice.id, handleProgress);
      
      // Check mount status after async operation
      if (!isMountedRef.current) {
        console.log('[EmailProgress] Component unmounted after sync, skipping state update');
        return;
      }
      
      if (result.success) {
        // Check if we need to generate local PDF (offline mode or test mode)
        if (result.useLocalPdf) {
          setStepMessage("Generating local PDF...");
          try {
            const localPdf = await getInvoiceAsBase64(invoice);
            
            if (!isMountedRef.current) return;
            
            console.log('[EmailProgress] Local PDF generated, calling onReady...');
            setStatus("success");
            setTimeout(() => {
              if (isMountedRef.current) {
                onReady(localPdf);
              }
            }, 500);
          } catch (pdfErr) {
            if (!isMountedRef.current) return;
            
            console.error('[EmailProgress] Local PDF error:', pdfErr);
            setStatus("error");
            setErrorMessage(`Failed to generate local PDF: ${String(pdfErr)}`);
          }
        } else if (result.pdfBase64) {
          // Got IO PDF successfully
          console.log('[EmailProgress] IO PDF received, size:', result.pdfBase64.length, 'calling onReady...');
          setStatus("success");
          setTimeout(() => {
            if (isMountedRef.current) {
              onReady(result.pdfBase64!);
            }
          }, 500);
        } else {
          // This shouldn't happen with the new strict mode
          console.error('[EmailProgress] No PDF in result');
          setStatus("error");
          setErrorMessage("No PDF available from InvoicesOnline.");
        }
      } else {
        console.error('[EmailProgress] Sync failed:', result.error);
        setStatus("error");
        setErrorMessage(result.error || "Unknown error occurred");
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      setStatus("error");
      setErrorMessage(String(err));
    }
  }, [invoice, handleProgress, onReady]);

  useEffect(() => {
    // Set mounted ref on mount
    isMountedRef.current = true;
    
    if (open) {
      startSync();
    }
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
    };
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

  const handleCopyError = () => {
    if (errorMessage) {
      navigator.clipboard.writeText(errorMessage);
      toast.success("Error details copied to clipboard");
    }
  };

  const progressValue = (currentStep / 4) * 100;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          // ALWAYS prevent outside clicks - user must use Cancel button
          // This stops lingering events from dropdown close from closing dialog
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          // ALWAYS prevent - this stops the dropdown close event from closing the dialog
          e.preventDefault();
        }}
      >
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
                <p className="text-center text-muted-foreground max-w-sm break-words">
                  {errorMessage}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyError}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Error
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
