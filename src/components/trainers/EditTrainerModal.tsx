
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EditTrainerForm } from "./EditTrainerForm";
import { Trainer } from "./types/trainer";

interface EditTrainerModalProps {
  trainer: Trainer;
}

export function EditTrainerModal({ trainer }: EditTrainerModalProps) {
  const [open, setOpen] = useState(false);
  
  const handleSuccess = () => {
    console.log("Trainer updated successfully, closing modal");
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit trainer</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Edit Trainer</DialogTitle>
          <DialogDescription>
            Update the trainer's information. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <EditTrainerForm trainer={trainer} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
