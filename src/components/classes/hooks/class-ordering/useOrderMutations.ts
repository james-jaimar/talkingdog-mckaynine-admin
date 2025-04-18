
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveOrderToDatabase } from "./saveOrderToDatabase";
import { useToast } from "@/components/ui/use-toast";

export function useOrderMutations(branchId: string | undefined, onOrderSaved?: () => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classIds: string[]) => {
      if (!branchId) {
        throw new Error("No branch selected");
      }
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
      
      if (onOrderSaved) {
        onOrderSaved();
      }
    },
    onError: (error) => {
      console.error("Failed to save class order:", error);
      toast({
        title: "Save failed",
        description: "Failed to save class order. Please try again.",
        variant: "destructive",
      });
    }
  });
}
