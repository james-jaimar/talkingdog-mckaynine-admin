
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function useTrainerLinking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Link trainer to user
  const linkTrainerToUser = async (userId: string, trainerId: string) => {
    try {
      // Update trainer record to link to this user
      const { error } = await supabase
        .from('trainers')
        .update({ user_id: userId })
        .eq('id', trainerId);
      
      if (error) throw error;

      toast({
        title: "Trainer linked",
        description: "User has been linked to the trainer profile.",
      });
      
      // Refresh both users and trainers data
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-for-users'] });
    } catch (error) {
      console.error("Error linking trainer to user:", error);
      toast({
        title: "Link failed",
        description: error instanceof Error ? error.message : "Failed to link trainer to user.",
        variant: "destructive",
      });
    }
  };

  // Unlink trainer from user
  const unlinkTrainerFromUser = async (userId: string, trainerId: string) => {
    try {
      // Update trainer record to remove user link
      const { error } = await supabase
        .from('trainers')
        .update({ user_id: null })
        .eq('id', trainerId)
        .eq('user_id', userId); // Double check it's the correct user
      
      if (error) throw error;

      toast({
        title: "Trainer unlinked",
        description: "User has been unlinked from the trainer profile.",
      });
      
      // Refresh both users and trainers data
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-for-users'] });
    } catch (error) {
      console.error("Error unlinking trainer from user:", error);
      toast({
        title: "Unlink failed",
        description: error instanceof Error ? error.message : "Failed to unlink trainer from user.",
        variant: "destructive",
      });
    }
  };

  return {
    linkTrainerToUser,
    unlinkTrainerFromUser
  };
}
