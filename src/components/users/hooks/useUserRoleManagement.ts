
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { APP_ID } from "@/constants/app";

export function useUserRoleManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: updateUserRole, isPending: isUpdating } = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      console.log(`[useUserRoleManagement] Starting role update for user ${userId} to role: ${role}`);
      
      if (!userId || !role) {
        throw new Error("User ID and role are required");
      }

      try {
        // Call our edge function to handle the role update
        const { data, error } = await supabase.functions.invoke("manage-user-role", {
          method: 'POST',
          body: { userId, role },
        });
        
        if (error) {
          console.error("[useUserRoleManagement] Edge function error:", error);
          throw new Error(`Role update failed: ${error.message}`);
        }
        
        if (!data || !data.success) {
          console.error("[useUserRoleManagement] Role update unsuccessful:", data);
          throw new Error(data?.error || "Role update failed");
        }
        
        return { success: true, role, userId };
      } catch (error) {
        console.error("[useUserRoleManagement] Transaction failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("[useUserRoleManagement] Role update successful:", data);
      toast({
        title: "Role updated",
        description: `User role has been updated to ${data.role}`,
      });

      // Invalidate and refetch ALL relevant queries to ensure UI is updated properly
      const queriesToInvalidate = [
        ['users-admin'],
        ['admin-users-list'],
        ['users'],
        ['trainers-list'],
        ['trainers-admin'],
        ['trainers'],
        ['user', data.userId],
        ['trainer', data.userId]
      ];

      queriesToInvalidate.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
        // Force refetch after a small delay to ensure DB has updated
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey });
        }, 300);
      });
    },
    onError: (error: Error) => {
      console.error("[useUserRoleManagement] Role update failed:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  return {
    updateUserRole,
    isUpdating
  };
}
