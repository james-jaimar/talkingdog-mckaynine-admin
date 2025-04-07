
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";

interface BookingToInvoiceFooterProps {
  isProcessing: boolean;
  selectedCount: number;
  onCancel: () => void;
  onCreateInvoice: () => Promise<void>;
}

export function BookingToInvoiceFooter({ 
  isProcessing, 
  selectedCount, 
  onCancel, 
  onCreateInvoice 
}: BookingToInvoiceFooterProps) {
  return (
    <DialogFooter>
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isProcessing}
      >
        Cancel
      </Button>
      <Button
        onClick={onCreateInvoice}
        disabled={selectedCount === 0 || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          'Create Invoice'
        )}
      </Button>
    </DialogFooter>
  );
}
