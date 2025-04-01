
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
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
      queryClient.invalidateQueries({ queryKey: ['active-classes', currentBranch?.id] });
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
  const moveClassUp = (orderedClasses: any[], index: number) => {
    if (index <= 0) return; // Already at the top
    
    const newOrder = [...orderedClasses];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save class order.",
        variant: "destructive",
      });
      return;
    }
    
    saveClassOrderMutation.mutate(newOrder.map(c => c.id));
    
    toast({
      title: "Class moved up",
      description: "The class order has been updated.",
    });
  };

  // Move class down in the order
  const moveClassDown = (orderedClasses: any[], index: number) => {
    if (index >= orderedClasses.length - 1) return; // Already at the bottom
    
    const newOrder = [...orderedClasses];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save class order.",
        variant: "destructive",
      });
      return;
    }
    
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
