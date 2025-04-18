
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { UserProfile } from "@/components/users/types/userTypes";

export interface UseUserManagementOptions {
  enabled?: boolean;
}

export function useUserManagement(options: UseUserManagementOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all users without filtering
  const {
    data: users = [],
    isLoading,
    isRefetching,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['users-admin'],
    queryFn: async () => {
      try {
        console.log("[useUserManagement] Fetching all users");
        
        // Get current user for marking in UI
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        console.log("Current user ID:", currentUser?.id);
        
        // Get all profiles without any filtering
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        console.log(`[useUserManagement] Fetched ${profiles?.length || 0} profiles`);
        
        // Map to UserProfile format
        const userProfiles: UserProfile[] = (profiles || []).map(profile => ({
          id: profile.id,
          email: profile.username || '', 
          username: profile.username || '',
          full_name: profile.full_name || '',
          role: profile.role || 'user',
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          app_id: profile.app_id,
          isCurrentUser: currentUser?.id === profile.id
        }));
        
        return userProfiles;
      } catch (error) {
        console.error("[useUserManagement] Error:", error);
        throw error;
      }
    },
    enabled,
    staleTime: 1000 * 60, // 1 minute
  });

  // Update user role
  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      console.log(`[useUserManagement] Updating user ${userId} to role: ${role}`);
      
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ role })
          .eq('id', userId);
        
        if (error) throw error;
        
        return { userId, role };
      } catch (error) {
        console.error("[useUserManagement] Error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Role update failed",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    }
  });

  // Reset user password
  const resetPassword = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      try {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          password: password
        });
        
        if (error) throw error;
        
        return { success: true };
      } catch (error) {
        console.error("[useUserManagement] Error resetting password:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: "Password has been reset successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password reset failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    }
  });

  return {
    users,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
    updateRole,
    resetPassword
  };
}
