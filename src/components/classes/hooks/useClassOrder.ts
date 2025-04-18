
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

      // Check if order already exists for this user and branch
      const { data: existingOrder } = await (supabase
        .from('class_tab_order') as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('branch_id', currentBranch?.id || null)
        .maybeSingle();

      if (existingOrder) {
        // Update existing order
        const { error } = await (supabase
          .from('class_tab_order') as any)
          .update({ class_ids: classIds })
          .eq('id', existingOrder.id);
          
        if (error) throw error;
      } else {
        // Create new order
        const { error } = await (supabase
          .from('class_tab_order') as any)
          .insert({
            user_id: user.id,
            branch_id: currentBranch?.id || null,
            class_ids: classIds
          });
          
        if (error) throw error;
      }
    },
    onSuccess: () => {
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
    saveClassOrderMutation.mutate(newOrder.map(c => c.id));
    
    toast({
      title: "Class moved up",
      description: "The class order has been updated.",
    });
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
    saveClassOrderMutation.mutate(newOrder.map(c => c.id));
    
    toast({
      title: "Class moved down",
      description: "The class order has been updated.",
    });
  };

  return {
    moveClassUp,
    moveClassDown
  };
}
