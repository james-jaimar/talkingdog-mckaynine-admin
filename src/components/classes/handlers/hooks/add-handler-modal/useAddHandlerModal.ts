
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
    if (!classData) {
      console.error("Missing class data, cannot add handler");
      toast({
        title: "Error",
        description: "Could not load class data. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }

    console.log("Adding handler to class with fee data:", {
      adminFeeType: classData.admin_fee_type,
      adminFeeValue: classData.admin_fee_value,
      trainerFeeType: classData.trainer_fee_type,
      trainerFeeValue: classData.trainer_fee_value,
      franchiseFeeType: classData.mckaynine_commission_type,
      franchiseFeeValue: classData.mckaynine_commission_value,
    });
      
    // Calculate fee rates correctly based on fee types
    let adminFeeRate = 0;
    let trainerFeeRate = 0;
    let franchiseFeeRate = 0;
    
    // Only convert to percentage rates if the type is percentage
    if (classData.admin_fee_type === 'percentage') {
      adminFeeRate = classData.admin_fee_value;
    }
    
    if (classData.trainer_fee_type === 'percentage') {
      trainerFeeRate = classData.trainer_fee_value;
    }
    
    if (classData.mckaynine_commission_type === 'percentage') {
      franchiseFeeRate = classData.mckaynine_commission_value;
    }

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
        franchiseFeeRate,
        adminFeeType: classData.admin_fee_type,
        trainerFeeType: classData.trainer_fee_type,
        franchiseFeeType: classData.mckaynine_commission_type,
        adminFeeValue: classData.admin_fee_value,
        trainerFeeValue: classData.trainer_fee_value,
        franchiseFeeValue: classData.mckaynine_commission_value,
        discountType: "fixed",
        discountAmount: 0
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
