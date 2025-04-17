
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { APP_ID } from "@/constants/app";

export function useUserRoleManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      console.log(`[useUserRoleManager] Updating user ${userId} to role: ${role}`);
      
      try {
        // Call the edge function to handle role updates
        const { data, error } = await supabase.functions.invoke('manage-user-role', {
          method: 'POST',
          body: { userId, role },
        });
        
        if (error) {
          console.error("[useUserRoleManager] Error:", error);
          throw error;
        }
        
        if (!data?.success) {
          throw new Error(data?.message || "Role update failed");
        }
        
        // Also ensure the user has an app_id set
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ app_id: APP_ID })
          .eq('id', userId)
          .is('app_id', null);
          
        if (updateError) {
          console.warn("[useUserRoleManager] Could not set app_id:", updateError);
          // Continue anyway as the main operation succeeded
        }
        
        return { userId, role };
      } catch (error) {
        console.error("[useUserRoleManager] Error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Role updated",
        description: `User role has been updated to ${data.role}`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-list'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Role update failed",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    }
  });

  return {
    updateUserRole
  };
}
