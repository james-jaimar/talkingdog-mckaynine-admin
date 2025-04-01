
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function useTrainerLinking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Link trainer to user
  const linkTrainerToUser = async (userId: string, trainerId: string) => {
    try {
      const { error } = await supabase
        .from('trainers')
        .update({ user_id: userId })
        .eq('id', trainerId);
      
      if (error) {
        throw error;
      }
      
      // Refresh both users and trainers data
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-admin'] });
      
      toast({
        title: "Trainer linked",
        description: "Trainer has been linked to this user successfully.",
      });
      
      return true;
    } catch (error) {
      console.error("Error linking trainer:", error);
      toast({
        title: "Link failed",
        description: error instanceof Error ? error.message : "Failed to link trainer",
        variant: "destructive",
      });
      return false;
    }
  };

  // Unlink trainer from user
  const unlinkTrainerFromUser = async (userId: string, trainerId: string) => {
    try {
      const { error } = await supabase
        .from('trainers')
        .update({ user_id: null })
        .eq('id', trainerId);
      
      if (error) {
        throw error;
      }
      
      // Refresh both users and trainers data
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-admin'] });
      
      toast({
        title: "Trainer unlinked",
        description: "Trainer has been unlinked from this user successfully.",
      });
      
      return true;
    } catch (error) {
      console.error("Error unlinking trainer:", error);
      toast({
        title: "Unlink failed",
        description: error instanceof Error ? error.message : "Failed to unlink trainer",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    linkTrainerToUser,
    unlinkTrainerFromUser
  };
}
