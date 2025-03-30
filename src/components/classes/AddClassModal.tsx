
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddClassForm } from "./AddClassForm";

interface AddClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddClassModal({ open, onOpenChange }: AddClassModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
        </DialogHeader>
        <AddClassForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
