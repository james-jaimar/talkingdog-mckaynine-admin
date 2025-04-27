
import { EditClassScheduleModal } from "../EditClassScheduleModal";
import { ClassSchedule } from "../types/classSchedule";

interface SchedulesEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  schedule: ClassSchedule | null;
  onSuccess: () => void;
}

export function SchedulesEditModal({
  isOpen,
  onOpenChange,
  classId,
  schedule,
  onSuccess
}: SchedulesEditModalProps) {
  return schedule ? (
    <EditClassScheduleModal 
      open={isOpen} 
      onOpenChange={(open) => {
        onOpenChange(open);
        // If modal is closing, clear the schedule to edit after a short delay
        if (!open) {
          setTimeout(() => {
            onOpenChange(false);
          }, 100);
        }
      }} 
      classId={classId}
      schedule={schedule}
      onSuccess={onSuccess}
    />
  ) : null;
}
