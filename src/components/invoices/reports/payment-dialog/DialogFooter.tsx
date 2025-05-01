
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";

interface PaymentDialogFooterProps {
  selectedClasses: string[];
  classDetails: TrainerClassDetail[];
  isPending: boolean;
  onCancel: () => void;
  onMarkAsPaid: () => void;
}

export function PaymentDialogFooter({ 
  selectedClasses, 
  classDetails, 
  isPending, 
  onCancel, 
  onMarkAsPaid 
}: PaymentDialogFooterProps) {
  const totalSelectedCommission = classDetails
    .filter(c => selectedClasses.includes(c.scheduleId))
    .reduce((sum, c) => sum + c.revenue, 0);
    
  return (
    <>
      <div className="flex justify-end gap-2 mt-4">
        <p className="text-sm font-medium">
          Total Selected: <span className="font-bold">{formatCurrency(totalSelectedCommission)}</span>
        </p>
      </div>
      
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={onMarkAsPaid}
          disabled={isPending || selectedClasses.length === 0}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Mark as Paid'
          )}
        </Button>
      </DialogFooter>
    </>
  );
}
