
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddHandlerForm } from "@/components/handlers/AddHandlerForm";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AddHandlerToClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  classData: any;
  onSuccess: () => void;
}

export function AddHandlerToClassModal({
  open,
  onOpenChange,
  classId,
  classData,
  onSuccess,
}: AddHandlerToClassModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSuccess = async () => {
    setIsProcessing(true);
    
    try {
      // Invalidate both handlers data and class-handlers data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["handlers"] }),
        queryClient.invalidateQueries({ queryKey: ["class-handlers", classId] })
      ]);
      
      console.log("Handler added and data refreshed for class:", classId);
      
      // Close modal
      onOpenChange(false);
      
      // Call the onSuccess callback (which might trigger additional refreshes)
      onSuccess();
      
      // Show success notification
      toast({
        title: "Success",
        description: "Handler added to class successfully.",
      });
    } catch (error) {
      console.error("Error refreshing data after adding handler:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // Prevent closing while processing
        if (isProcessing && newOpen === false) return;
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Handler to {classData?.name}</DialogTitle>
          <DialogDescription>
            Enter the details of the new handler and their dog.
          </DialogDescription>
        </DialogHeader>
        
        <AddHandlerForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
