
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function useUserRoleManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update user role
  const { mutate: updateUserRole, isPending: isUpdating } = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error("Error updating user role:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User role has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  return {
    updateUserRole,
    isUpdating
  };
}
