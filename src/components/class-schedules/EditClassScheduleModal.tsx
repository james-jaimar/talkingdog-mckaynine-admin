
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
        </DialogHeader>
        <EditClassScheduleForm 
          classId={classId} 
          schedule={schedule}
          onSuccess={onSuccess} 
        />
      </DialogContent>
    </Dialog>
  );
}
