
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveOrderToDatabase } from "./saveOrderToDatabase";

export function useSaveClassOrder(branchId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const mutation = useMutation({
    mutationFn: (classIds: string[]) => {
      if (!branchId) {
        throw new Error("No branch selected");
      }
      setIsSaving(true);
      return saveOrderToDatabase(classIds, branchId);
    },
    onSuccess: () => {
      toast({
        title: "Order saved",
        description: "Class order has been saved successfully.",
      });
      
      if (branchId) {
        queryClient.invalidateQueries({ queryKey: ['class-tab-order', branchId] });
      }
      
      setIsSaving(false);
    },
    onError: (error) => {
      console.error("Failed to save class order:", error);
      toast({
        title: "Save failed",
        description: "Failed to save class order. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  });

  const saveClassOrder = (classIds: string[]) => {
    if (!isSaving) {
      mutation.mutate(classIds);
    }
  };

  return {
    saveClassOrder,
    isSaving: isSaving || mutation.isPending
  };
}
