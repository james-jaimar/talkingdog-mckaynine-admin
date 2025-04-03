
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ModalHeaderProps {
  classData: any;
}

export function ModalHeader({ classData }: ModalHeaderProps) {
  return (
    <DialogHeader>
      <DialogTitle>Add Handler to {classData?.name}</DialogTitle>
      <DialogDescription>
        Select an existing handler to add to this class.
      </DialogDescription>
    </DialogHeader>
  );
}
