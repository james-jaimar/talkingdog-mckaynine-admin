
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditClassScheduleForm } from "./EditClassScheduleForm";
import { ClassSchedule } from "./types/classSchedule";
import { useEffect } from "react";

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
  // Handle successful form submission
  const handleSuccess = () => {
    // Close the modal first
    onOpenChange(false);
    // Then call the parent's onSuccess handler after a short delay
    setTimeout(() => {
      onSuccess();
    }, 100);
  };

  // Ensure proper cleanup when dialog is closed
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    
    // If closing the dialog, make sure we don't have any lingering state
    if (!isOpen) {
      // Allow any animations to complete before notifying parent
      setTimeout(() => {
        document.body.style.pointerEvents = ""; // Reset any pointer-events styling
      }, 100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
