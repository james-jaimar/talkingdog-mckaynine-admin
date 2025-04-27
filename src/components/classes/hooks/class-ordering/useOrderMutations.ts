
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveOrderToDatabase } from "./saveOrderToDatabase";
import { useToast } from "@/components/ui/use-toast";

export function useOrderMutations(branchId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (classIds: string[]) => {
      if (!branchId) {
        throw new Error("No branch selected");
      }
      console.log(`Mutation starting for branch ${branchId} with class IDs:`, classIds);
      return saveOrderToDatabase(classIds, branchId);
    },
    onSuccess: (result, variables) => {
      console.log("Order mutation succeeded:", result);
      toast({
        title: "Order saved",
        description: "Class order has been saved successfully."
      });
      
      if (branchId) {
        // Invalidate relevant queries to ensure UI is updated on next fetch
        // but don't trigger an immediate refetch as we're using optimistic updates
        queryClient.invalidateQueries({ 
          queryKey: ['class-tab-order', branchId],
          refetchType: 'none'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['classes', branchId],
          refetchType: 'none'
        });
      }
    },
    onError: (error) => {
      console.error("Failed to save class order:", error);
      toast({
        title: "Save failed",
        description: "Failed to save class order. Please try again.",
        variant: "destructive"
      });
    }
  });
}
