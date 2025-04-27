
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveOrderToDatabase } from "./saveOrderToDatabase";
import { useToast } from "@/components/ui/use-toast";
import { ClassWithSchedules } from "../types/class-with-schedules";

export function useOrderMutations(branchId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (classIds: string[]) => {
      if (!branchId) {
        throw new Error("No branch selected");
      }
      console.log(`Mutation starting for branch ${branchId} with ${classIds.length} class IDs`);
      return saveOrderToDatabase(classIds, branchId);
    },
    
    // Optimistic update handling
    onMutate: async (newClassIds) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ 
        queryKey: ['classes', branchId]
      });
      
      // Snapshot the previous value
      const previousClasses = queryClient.getQueryData<ClassWithSchedules[]>(['classes', branchId]);
      
      // Apply optimistic update - reorder the classes based on the new order
      if (previousClasses && previousClasses.length > 0) {
        console.log("Applying optimistic update to class order");
        
        // Create a map for quick lookup
        const classMap = new Map(previousClasses.map(c => [c.id, c]));
        
        // Create optimistically updated array
        const optimisticClasses = newClassIds
          .map(id => classMap.get(id))
          .filter(Boolean) as ClassWithSchedules[];
          
        // Add any classes that weren't in the newClassIds
        previousClasses.forEach(c => {
          if (!newClassIds.includes(c.id)) {
            optimisticClasses.push(c);
          }
        });
        
        // Update the cache with our optimistic value
        queryClient.setQueryData(['classes', branchId], optimisticClasses);
      }
      
      return { previousClasses };
    },
    
    onSuccess: (_, variables) => {
      console.log("Order saved successfully with", variables.length, "classes");
      toast({
        title: "Order saved",
        description: "Class order has been updated"
      });
    },
    
    onError: (error, _, context) => {
      console.error("Failed to save class order:", error);
      
      // Revert back to the previous state if available
      if (context?.previousClasses) {
        queryClient.setQueryData(['classes', branchId], context.previousClasses);
      }
      
      toast({
        title: "Save failed",
        description: "Failed to save class order. Please try again.",
        variant: "destructive"
      });
    },
    
    // Don't refetch after a successful update - rely on our optimistic update
    onSettled: () => {
      console.log("Order mutation settled, invalidating queries");
      // Don't trigger immediate refetch but mark as stale
      if (branchId) {
        queryClient.invalidateQueries({ 
          queryKey: ['classes', branchId],
          refetchType: 'none'
        });
        
        queryClient.invalidateQueries({ 
          queryKey: ['class-tab-order', branchId],
          refetchType: 'none'
        });
      }
    }
  });
}
