import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CascadeDiff } from "./hooks/utils/cascade-diff";
import { CascadePreview } from "./hooks/utils/useCascadeClassEdit";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  diff: CascadeDiff;
  preview: CascadePreview | null;
  loading: boolean;
  onSaveOnly: () => void;
  onSaveAndCascade: () => void;
}

export function CascadeConfirmDialog({
  open,
  onOpenChange,
  diff,
  preview,
  loading,
  onSaveOnly,
  onSaveAndCascade,
}: Props) {
  const nothingToCascade =
    !preview ||
    (preview.draftDescriptionsToUpdate === 0 &&
      preview.pendingTrainerPaymentsToRecalc === 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cascade class changes?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              {diff.nameChanged && (
                <div>
                  <strong>Name change:</strong> "{diff.oldName}" → "
                  {diff.newName}"
                </div>
              )}
              {diff.feesChanged && (
                <div>
                  <strong>Fee/commission changes:</strong>{" "}
                  {diff.changedFeeFields.join(", ")}
                </div>
              )}
              {preview ? (
                <ul className="list-disc pl-5 space-y-1">
                  {diff.nameChanged && (
                    <>
                      <li>
                        Rewrite{" "}
                        <strong>{preview.draftDescriptionsToUpdate}</strong>{" "}
                        invoice item description(s) on draft invoices
                      </li>
                      <li className="text-muted-foreground">
                        Leave{" "}
                        <strong>{preview.sentInvoicesUntouched}</strong>{" "}
                        item(s) on sent/paid invoices unchanged
                      </li>
                    </>
                  )}
                  {diff.feesChanged && (
                    <li>
                      Recalculate{" "}
                      <strong>
                        {preview.pendingTrainerPaymentsToRecalc}
                      </strong>{" "}
                      pending trainer payment(s)
                    </li>
                  )}
                </ul>
              ) : (
                <div className="text-muted-foreground">
                  Counting affected records…
                </div>
              )}
              <div className="text-xs text-muted-foreground pt-2">
                Sent, paid, cancelled invoices and paid trainer payments are
                never touched.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <button
            type="button"
            disabled={loading}
            onClick={onSaveOnly}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            Save only
          </button>
          <AlertDialogAction
            disabled={loading || nothingToCascade}
            onClick={onSaveAndCascade}
          >
            {loading ? "Applying…" : "Save & cascade"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
