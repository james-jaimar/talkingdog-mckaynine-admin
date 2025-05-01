
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DialogHeaderProps {
  trainerName: string;
  toggleSelectAll: (checked: boolean) => void;
  hasUnpaidClasses: boolean;
  allUnpaidSelected: boolean;
}

export function PaymentDialogHeader({ 
  trainerName, 
  toggleSelectAll, 
  hasUnpaidClasses,
  allUnpaidSelected
}: DialogHeaderProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Mark Payments for {trainerName}</DialogTitle>
        <DialogDescription>
          Select classes to mark as paid for this trainer.
        </DialogDescription>
      </DialogHeader>
      
      {hasUnpaidClasses && (
        <div className="flex items-center gap-2 mb-2">
          <Checkbox 
            id="select-all" 
            checked={allUnpaidSelected}
            onCheckedChange={toggleSelectAll}
          />
          <label htmlFor="select-all" className="text-sm font-medium">
            Select All Unpaid Classes
          </label>
        </div>
      )}
    </>
  );
}
