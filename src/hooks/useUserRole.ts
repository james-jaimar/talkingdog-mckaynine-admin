
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { APP_ID } from "@/constants/app";

export function useUserRole() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      console.log(`[useUserRole] Updating user ${userId} to role: ${role}`);
      
      try {
        // Call our edge function to handle role updates
        const { data, error } = await supabase.functions.invoke('update-user-role', {
          method: 'POST',
          body: { userId, role, appId: APP_ID },
        });
        
        if (error) throw error;
        if (!data?.success) throw new Error(data?.message || "Role update failed");
        
        return { userId, role };
      } catch (error) {
        console.error("[useUserRole] Error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Role update failed",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    }
  });

  return { updateUserRole };
}
