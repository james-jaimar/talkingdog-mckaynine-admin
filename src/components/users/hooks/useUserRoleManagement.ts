
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function useUserRoleManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update user role
  const { mutate: updateUserRole, isPending: isUpdating } = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      console.log(`Updating user ${userId} to role: ${role}`);
      
      if (!userId || !role) {
        throw new Error("User ID and role are required");
      }
      
      // First, check if user exists to provide better error messages
      const { data: userExists, error: userCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (userCheckError || !userExists) {
        console.error("User not found:", userCheckError);
        throw new Error("User not found. Please refresh and try again.");
      }
      
      // Update the user's role
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error("Error updating user role:", error);
        throw error;
      }
      
      console.log("User role updated successfully:", data);
      return data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "User updated",
        description: `User role has been updated to ${variables.role} successfully.`,
      });
      
      // Invalidate all potentially affected queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Force refetch after a short delay to ensure consistency
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['users-admin'] });
      }, 300);
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
