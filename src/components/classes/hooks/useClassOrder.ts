
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useBranch } from "@/context/BranchContext";

export function useClassOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();

  // Save class order to database
  const saveClassOrderMutation = useMutation({
    mutationFn: async (classIds: string[]) => {
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
          .update({ class_ids: classIds })
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
            branch_id: currentBranch.id,
            class_ids: classIds
          });
          
        if (error) {
          console.error("Error creating class order:", error);
          throw error;
        }
        
        console.log("Created new class order");
      }

      return classIds;
    },
    onSuccess: (classIds) => {
      // Shows success notification
      toast({
        title: "Class order saved",
        description: "Your class order has been updated.",
      });

      // Force a complete refresh of the data
      queryClient.invalidateQueries({ queryKey: ['classes', currentBranch?.id] });
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

  // Move class up in the order
  const moveClassUp = (index: number) => {
    if (index <= 0) return; // Already at the top
    
    // Get the current classes data from cache
    const classes = queryClient.getQueryData(['classes', currentBranch?.id]) as any[] || [];
    
    if (!classes.length) return;
    
    console.log('Before swap (moveUp):', classes.map(c => c.name));
    
    // Create a new array with the swapped items
    const newOrder = [...classes];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    
    console.log('After swap (moveUp):', newOrder.map(c => c.name));
    
    // Update the cache immediately for a responsive UI
    queryClient.setQueryData(['classes', currentBranch?.id], newOrder);
    
    // Save the new order to the database (only the IDs)
    const classIds = newOrder.map(c => c.id);
    saveClassOrderMutation.mutate(classIds);
  };

  // Move class down in the order
  const moveClassDown = (index: number) => {
    // Get the current classes data from cache
    const classes = queryClient.getQueryData(['classes', currentBranch?.id]) as any[] || [];
    
    if (!classes.length || index >= classes.length - 1) return; // Already at the bottom
    
    console.log('Before swap (moveDown):', classes.map(c => c.name));
    
    // Create a new array with the swapped items
    const newOrder = [...classes];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    
    console.log('After swap (moveDown):', newOrder.map(c => c.name));
    
    // Update the cache immediately for a responsive UI
    queryClient.setQueryData(['classes', currentBranch?.id], newOrder);
    
    // Save the new order to the database (only the IDs)
    const classIds = newOrder.map(c => c.id);
    saveClassOrderMutation.mutate(classIds);
  };

  return {
    moveClassUp,
    moveClassDown,
    isLoading: saveClassOrderMutation.isPending
  };
}
