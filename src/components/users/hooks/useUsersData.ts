
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  isCurrentUser?: boolean;
}

export function useUsersData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all users
  const { 
    data: users = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        // Get current user for marking in UI
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Get all profiles
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!profiles || profiles.length === 0) {
          return [];
        }
        
        // Map to user profiles
        return profiles.map(profile => ({
          id: profile.id,
          email: profile.username || '', // Email is stored in username field
          username: profile.username || '',
          full_name: profile.full_name || '',
          role: profile.role || 'user',
          avatar_url: profile.avatar_url,
          created_at: profile.created_at || new Date().toISOString(),
          isCurrentUser: profile.id === currentUser?.id
        }));
      } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });

  // Update user role
  const { mutate: updateUserRole, isPending: isUpdating } = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
      
      if (error) throw error;
      
      return { userId, role };
    },
    onSuccess: (data) => {
      toast({
        title: "Role updated",
        description: `User role has been updated to ${data.role}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset user password
  const { mutate: resetPassword, isPending: isResetting } = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });
      
      if (error) throw error;
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: "User password has been reset successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    users,
    isLoading,
    error,
    refetch,
    updateUserRole,
    isUpdating,
    resetPassword,
    isResetting
  };
}
