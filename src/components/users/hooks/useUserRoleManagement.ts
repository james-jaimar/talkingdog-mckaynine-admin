
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type RoleOperation = "setRole" | "addRole" | "removeRole";

export function useUserRoleManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidateAfterUpdate = (userId: string) => {
    setTimeout(() => {
      const queriesToInvalidate = [
        ['users-admin'], ['admin-users-list'], ['users'],
        ['trainers-list'], ['trainers-admin'], ['trainers'],
        ['user', userId], ['trainer', userId]
      ];
      queriesToInvalidate.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
        queryClient.refetchQueries({ queryKey });
      });
    }, 500);
  };

  const { mutateAsync: updateUserRole, isPending: isUpdating } = useMutation({
    mutationFn: async ({ userId, role, operation = "setRole" }: { userId: string; role: string; operation?: RoleOperation }) => {
      console.log(`[useUserRoleManagement] ${operation} for user ${userId}, role: ${role}`);
      
      if (!userId || !role) throw new Error("User ID and role are required");

      const { data, error } = await supabase.functions.invoke("manage-user-role", {
        method: 'POST',
        body: { userId, role, operation },
      });
      
      if (error) throw new Error(`Role update failed: ${error.message}`);
      if (!data?.success) throw new Error(data?.error || "Role update failed");
      
      return { success: true, role, userId, operation };
    },
    onSuccess: (data) => {
      const actionLabel = data.operation === "addRole" ? "added" : data.operation === "removeRole" ? "removed" : "updated to";
      toast({
        title: "Role updated",
        description: `Role ${actionLabel} ${data.role}`,
      });
      invalidateAfterUpdate(data.userId);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  return { updateUserRole, isUpdating };
}
