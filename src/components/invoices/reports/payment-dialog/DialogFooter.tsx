
import { Button } from "@/components/ui/button";

interface DialogFooterProps {
  onCancel: () => void;
  onSubmit: () => void;
  isPending?: boolean;
}

export function DialogFooter({ onCancel, onSubmit, isPending = false }: DialogFooterProps) {
  return (
    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
      <Button variant="outline" onClick={onCancel} disabled={isPending}>
        Cancel
      </Button>
      <Button type="submit" onClick={onSubmit} disabled={isPending}>
        {isPending ? "Processing..." : "Record Payment"}
      </Button>
    </div>
  );
}
