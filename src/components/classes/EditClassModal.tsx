
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditClassForm } from "./EditClassForm";
import { Class } from "./types/class";

interface EditClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: Class;
  onSuccess: () => void;
}

export function EditClassModal({ open, onOpenChange, classData, onSuccess }: EditClassModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
        </DialogHeader>
        <EditClassForm classData={classData} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
