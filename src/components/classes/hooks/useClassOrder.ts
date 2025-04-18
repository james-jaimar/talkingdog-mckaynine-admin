
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth";
import { useBranch } from "@/context/BranchContext";

export function useClassOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentBranch } = useBranch();

  // Save class order to database
  const saveClassOrderMutation = useMutation({
    mutationFn: async (classIds: string[]) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      if (!currentBranch?.id) {
        throw new Error("No branch selected");
      }

      console.log("Saving class order to database:", classIds);

      // Check if order already exists for this branch
      const { data: existingOrder, error: fetchError } = await supabase
        .from('class_tab_order')
        .select('id')
        .eq('branch_id', currentBranch.id)
        .maybeSingle();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error checking existing order:", fetchError);
        throw fetchError;
      }

      if (existingOrder) {
        // Update existing order
        const { error } = await supabase
          .from('class_tab_order')
          .update({ 
            class_ids: classIds,
            user_id: user.id  // Update with current user
          })
          .eq('id', existingOrder.id);
          
        if (error) {
          console.error("Error updating class order:", error);
          throw error;
        }
        
        console.log("Updated existing class order");
      } else {
        // Create new order
        const { error } = await supabase
          .from('class_tab_order')
          .insert({
            user_id: user.id,
            branch_id: currentBranch.id,
            class_ids: classIds
          });
          
        if (error) {
          console.error("Error creating class order:", error);
          throw error;
        }
        
        console.log("Created new class order");
      }

      // Return the updated class IDs to update the cache
      return classIds;
    },
    onSuccess: (classIds) => {
      // On successful save, update the class-tab-order query
      queryClient.setQueryData(['class-tab-order', currentBranch?.id], (oldData: any) => {
        if (!oldData) {
          return {
            branch_id: currentBranch?.id,
            class_ids: classIds,
            user_id: user?.id
          };
        }
        
        return {
          ...oldData,
          class_ids: classIds
        };
      });
      
      queryClient.invalidateQueries({ queryKey: ['class-tab-order', currentBranch?.id] });
    },
    onError: (error) => {
      console.error("Error saving class order:", error);
      toast({
        title: "Error",
        description: "Failed to save class order. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Move class up in the order - accepts only index
  const moveClassUp = (index: number) => {
    if (index <= 0) return; // Already at the top
    
    // Get the current classes data from cache
    const classes = queryClient.getQueryData(['classes', currentBranch?.id]) as any[] || [];
    
    if (!classes.length) return;
    
    console.log('Before swap (moveUp):', classes.map(c => c.name));
    
    // Create a new array with the swapped items (shallow copy of the array)
    const newOrder = [...classes];
    // Store references to the two items being swapped
    const itemToMove = newOrder[index];
    const itemToReplace = newOrder[index - 1];
    
    // Perform the swap
    newOrder[index - 1] = itemToMove;
    newOrder[index] = itemToReplace;
    
    console.log('After swap (moveUp):', newOrder.map(c => c.name));
    
    // Update the cache immediately for a responsive UI
    queryClient.setQueryData(['classes', currentBranch?.id], newOrder);
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save class order.",
        variant: "destructive",
      });
      return;
    }
    
    // Save the new order to the database (only the IDs)
    const classIds = newOrder.map(c => c.id);
    saveClassOrderMutation.mutate(classIds);
  };

  // Move class down in the order - accepts only index
  const moveClassDown = (index: number) => {
    // Get the current classes data from cache
    const classes = queryClient.getQueryData(['classes', currentBranch?.id]) as any[] || [];
    
    if (!classes.length || index >= classes.length - 1) return; // Already at the bottom
    
    console.log('Before swap (moveDown):', classes.map(c => c.name));
    
    // Create a new array with the swapped items (shallow copy of the array)
    const newOrder = [...classes];
    // Store references to the two items being swapped
    const itemToMove = newOrder[index];
    const itemToReplace = newOrder[index + 1];
    
    // Perform the swap
    newOrder[index + 1] = itemToMove;
    newOrder[index] = itemToReplace;
    
    console.log('After swap (moveDown):', newOrder.map(c => c.name));
    
    // Update the cache immediately for a responsive UI
    queryClient.setQueryData(['classes', currentBranch?.id], newOrder);
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save class order.",
        variant: "destructive",
      });
      return;
    }
    
    // Save the new order to the database (only the IDs)
    const classIds = newOrder.map(c => c.id);
    saveClassOrderMutation.mutate(classIds);
  };

  return {
    moveClassUp,
    moveClassDown
  };
}
