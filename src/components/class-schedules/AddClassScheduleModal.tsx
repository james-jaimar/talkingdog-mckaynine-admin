
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddClassScheduleForm } from "./AddClassScheduleForm";
import { Class } from "../classes/types/class";

interface AddClassScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  classData: Class;
}

export function AddClassScheduleModal({ 
  open, 
  onOpenChange, 
  classId,
  classData,
}: AddClassScheduleModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule for {classData.name}</DialogTitle>
        </DialogHeader>
        <AddClassScheduleForm 
          classId={classId} 
          onSuccess={() => onOpenChange(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}
