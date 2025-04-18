
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditClassScheduleForm } from "./EditClassScheduleForm";
import { ClassSchedule } from "./types/classSchedule";
import { useEffect, useState } from "react";

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
  // Track local state to prevent interaction issues
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Clear transition state when modal opens/closes
  useEffect(() => {
    if (open) {
      setIsTransitioning(false);
    }
  }, [open]);

  // Handle successful form submission
  const handleSuccess = () => {
    // Signal that we're in transition
    setIsTransitioning(true);
    
    // Close the modal first
    onOpenChange(false);
    
    // Then call the parent's onSuccess handler after a short delay
    setTimeout(() => {
      onSuccess();
      setIsTransitioning(false);
    }, 100);
  };

  // Ensure proper cleanup when dialog is closed
  const handleOpenChange = (isOpen: boolean) => {
    if (isTransitioning) return; // Prevent interactions during transitions
    
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-background">
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
