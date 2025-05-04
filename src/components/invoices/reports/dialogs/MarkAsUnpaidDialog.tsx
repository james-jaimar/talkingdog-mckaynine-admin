
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface MarkAsUnpaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  scheduleCount: number;
  isProcessing: boolean;
}

export function MarkAsUnpaidDialog({
  open,
  onOpenChange,
  onConfirm,
  scheduleCount,
  isProcessing
}: MarkAsUnpaidDialogProps) {
  return (
    <AlertDialog 
      open={open} 
      onOpenChange={(open) => {
        if (!isProcessing) onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Mark as Unpaid</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to mark this trainer's paid classes as unpaid? 
            This action will revert any payment records and cannot be undone.
            {scheduleCount > 0 && (
              <p className="mt-2 font-medium">
                {scheduleCount} class(es) will be marked as unpaid.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Yes, Mark as Unpaid"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
