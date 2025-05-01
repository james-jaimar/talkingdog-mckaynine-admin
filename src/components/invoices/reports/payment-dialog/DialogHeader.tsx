
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentDialogHeaderProps {
  trainerName: string;
  totalAmount?: number;
  classCount: number;
  toggleSelectAll?: (checked: boolean) => void;
  hasUnpaidClasses?: boolean;
  allUnpaidSelected?: boolean;
}

export function PaymentDialogHeader({ 
  trainerName, 
  totalAmount,
  classCount,
  toggleSelectAll,
  hasUnpaidClasses = false,
  allUnpaidSelected = false
}: PaymentDialogHeaderProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Mark Payments for {trainerName}</DialogTitle>
        <DialogDescription>
          Select classes to mark as paid for this trainer.
        </DialogDescription>
      </DialogHeader>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Selected: <span className="font-medium">{classCount} classes</span>
            {totalAmount !== undefined && (
              <span className="ml-2">| Total amount: <span className="font-medium">${totalAmount.toFixed(2)}</span></span>
            )}
          </p>
        </div>
        
        {hasUnpaidClasses && toggleSelectAll && (
          <div className="flex items-center gap-2">
            <Checkbox 
              id="select-all" 
              checked={allUnpaidSelected}
              onCheckedChange={toggleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All Unpaid
            </label>
          </div>
        )}
      </div>
    </>
  );
}
