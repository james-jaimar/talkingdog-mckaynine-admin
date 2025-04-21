
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useInvoices } from "@/hooks/useInvoices";
import { useBranch } from "@/context/BranchContext";
import { addHandlerToClass } from "./addHandlerToClass";
import { Class } from "@/components/classes/types/class";

interface UseAddHandlerModalProps {
  classId: string;
  classData?: Class | null;
  onSuccess: () => void;
  onOpenChange: (open: boolean) => void;
}

export function useAddHandlerModal({ 
  classId, 
  classData,
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
    // Calculate fee rates based on class data
    const adminFeeRate = classData?.admin_fee_type === 'percentage' ? 
      classData.admin_fee_value : 0;
      
    const trainerFeeRate = classData?.trainer_fee_type === 'percentage' ? 
      classData.trainer_fee_value : 0;
      
    const franchiseFeeRate = classData?.mckaynine_commission_type === 'percentage' ? 
      classData.mckaynine_commission_value : 0;

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
        currentBranch,
        adminFeeRate,
        trainerFeeRate,
        franchiseFeeRate
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
