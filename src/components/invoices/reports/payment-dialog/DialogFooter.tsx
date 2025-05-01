
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";

interface DialogFooterProps {
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
  onMarkAsPaid,
}: DialogFooterProps) {
  // Calculate total amount for selected classes
  const totalAmount = classDetails
    .filter(c => selectedClasses.includes(c.scheduleId))
    .reduce((sum, c) => sum + c.potentialRevenue, 0);
  
  return (
    <div className="flex flex-col space-y-2 sm:space-y-0 sm:space-x-2 sm:flex-row-reverse sm:justify-between mt-4">
      <div className="flex flex-col sm:flex-row sm:space-x-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={onMarkAsPaid}
          disabled={selectedClasses.length === 0 || isPending}
        >
          {isPending ? "Processing..." : "Mark as Paid"}
        </Button>
      </div>
      <div className="flex items-center">
        <p className="text-sm font-medium">
          Total Selected: <span className="font-semibold">{formatCurrency(totalAmount)}</span>
        </p>
      </div>
    </div>
  );
}
