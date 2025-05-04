
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface FixZeroAmountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  scheduleCount: number;
  isProcessing: boolean;
}

export function FixZeroAmountsDialog({
  open,
  onOpenChange,
  onConfirm,
  scheduleCount,
  isProcessing
}: FixZeroAmountsDialogProps) {
  return (
    <AlertDialog 
      open={open} 
      onOpenChange={(open) => {
        if (!isProcessing) onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Fix Zero Amount Payments</AlertDialogTitle>
          <AlertDialogDescription>
            Some payment records have incorrect (zero) amounts. This utility will recalculate 
            the correct payment amounts based on the booking data.
            {scheduleCount > 0 && (
              <p className="mt-2 font-medium">
                {scheduleCount} payment record(s) will be fixed.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-700"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Fix Payment Records"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
