
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
    onMutate: async (variables) => {
      // This runs before the mutation, variables are the classIds
      console.log('Starting mutation with variables:', variables);
      
      // Prevent any immediate refetching of queries that might
      // interfere with our optimistic update
      await queryClient.cancelQueries({ 
        queryKey: ['classes', branchId]
      });
      await queryClient.cancelQueries({ 
        queryKey: ['class-tab-order', branchId]
      });
      
      return { classIds: variables };
    },
    onSuccess: (result, variables) => {
      console.log("Order mutation succeeded:", result);
      toast({
        title: "Order saved",
        description: "Class order has been saved successfully."
      });
      
      // Silently mark the queries as stale so they'll refresh
      // on the next refetch, but don't trigger an immediate refresh
      if (branchId) {
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
    onError: (error, variables, context) => {
      console.error("Failed to save class order:", error);
      toast({
        title: "Save failed",
        description: "Failed to save class order. Please try again.",
        variant: "destructive"
      });
      
      // If we have the previous state, we can use it to refresh the data
      if (context) {
        console.log("Error occurred, should refresh data");
      }
    }
  });
}
