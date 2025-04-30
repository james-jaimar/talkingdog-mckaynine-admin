
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditClassForm } from "./EditClassForm";
import { ClassWithSchedules } from "./hooks/types/class-with-schedules";

interface EditClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: ClassWithSchedules | null;
  onSuccess?: () => void;
}

export function EditClassModal({
  open,
  onOpenChange,
  classData,
  onSuccess,
}: EditClassModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Class: {classData?.name}</DialogTitle>
        </DialogHeader>
        {classData && (
          <EditClassForm
            classData={classData}
            onSuccess={onSuccess}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
