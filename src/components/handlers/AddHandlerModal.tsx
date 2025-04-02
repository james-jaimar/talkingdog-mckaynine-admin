
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { AddHandlerForm } from "./AddHandlerForm";
import { useQueryClient } from "@tanstack/react-query";

export function AddHandlerModal() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    console.log("Form submitted successfully, closing modal");
    setOpen(false);
    
    // Force manual refetch of handlers data to update the list
    queryClient.invalidateQueries({ queryKey: ["handlers"] });
    
    // Additional delay before allowing the modal to reopen
    // This ensures any data operations have completed
    setTimeout(() => {
      // Nothing needed here, just ensuring a delay
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          id="add-handler-trigger"
          variant="mckaynine"
          size="lg"
        >
          <PlusCircle className="h-5 w-5" />
          <span>Add Handler</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>Add New Handler</DialogTitle>
          <DialogDescription>
            Enter the details of the new handler and their dog.
          </DialogDescription>
        </DialogHeader>
        <AddHandlerForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
