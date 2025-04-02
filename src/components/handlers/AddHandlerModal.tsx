
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
import { useState, useEffect } from "react";
import { AddHandlerForm } from "./AddHandlerForm";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function AddHandlerModal() {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Reset processing state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsProcessing(false);
    }
  }, [open]);

  const handleSuccess = async () => {
    console.log("Form submitted successfully, closing modal and refreshing data");
    setIsProcessing(true);
    
    try {
      // Force manual refetch of handlers data to update the list
      await queryClient.invalidateQueries({ queryKey: ["handlers"] });
      console.log("Data invalidated, closing modal");
      
      // Close modal
      setOpen(false);
      
      // Show success notification
      toast({
        title: "Success",
        description: "Handler added successfully. The list will update momentarily.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error refreshing handlers data:", error);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // Prevent closing while processing
        if (isProcessing && newOpen === false) {
          return;
        }
        setOpen(newOpen);
      }}
    >
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
