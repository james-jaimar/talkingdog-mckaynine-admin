
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddTrainerForm } from "./AddTrainerForm";

export function AddTrainerModal() {
  const [open, setOpen] = useState(false);
  
  const handleSuccess = () => {
    console.log("Trainer added successfully, closing modal");
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="mckaynine" 
          size="lg"
        >
          <UserPlus className="h-5 w-5" />
          <span>Add Trainer</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Add New Trainer</DialogTitle>
          <DialogDescription>
            Enter the details for the new trainer. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <AddTrainerForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
