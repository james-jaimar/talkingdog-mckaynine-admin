
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditClassScheduleForm } from "./EditClassScheduleForm";
import { ClassSchedule } from "./types/classSchedule";

interface EditClassScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  schedule: ClassSchedule;
  onSuccess: () => void;
}

export function EditClassScheduleModal({ 
  open, 
  onOpenChange, 
  classId,
  schedule,
  onSuccess,
}: EditClassScheduleModalProps) {
  // Handle success by properly closing the modal first
  const handleSuccess = () => {
    // Close the modal first
    onOpenChange(false);
    // Then call the parent's onSuccess handler after a short delay
    setTimeout(() => {
      onSuccess();
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
          <DialogDescription>
            Make changes to the selected class schedule.
          </DialogDescription>
        </DialogHeader>
        <EditClassScheduleForm 
          classId={classId} 
          schedule={schedule}
          onSuccess={handleSuccess} 
        />
      </DialogContent>
    </Dialog>
  );
}
