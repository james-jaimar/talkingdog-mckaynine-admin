
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useInvoices } from "@/hooks/useInvoices";
import { useBranch } from "@/context/BranchContext";
import { addHandlerToClass } from "./addHandlerToClass";

interface UseAddHandlerModalProps {
  classId: string;
  onSuccess: () => void;
  onOpenChange: (open: boolean) => void;
}

export function useAddHandlerModal({ 
  classId, 
  onSuccess, 
  onOpenChange 
}: UseAddHandlerModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { createInvoice, generateInvoiceNumber } = useInvoices();
  const { currentBranch } = useBranch();

  const handleAddHandlerToClass = async (handlerId: string, dogId: string) => {
    await addHandlerToClass({
      handlerId,
      dogId,
      classId,
      setIsProcessing,
      isProcessing,
      onOpenChange,
      onSuccess,
      queryClient,
      toast,
      createInvoiceProps: {
        handlerId,
        dogId,
        generateInvoiceNumber,
        createInvoice,
        currentBranch
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing while processing
    if (isProcessing && newOpen === false) return;
    
    // Clear search when opening/closing
    if (!newOpen) {
      setSearchQuery("");
    }
    
    onOpenChange(newOpen);
  };

  return {
    isProcessing,
    searchQuery,
    setSearchQuery,
    addHandlerToClass: handleAddHandlerToClass,
    handleOpenChange
  };
}
