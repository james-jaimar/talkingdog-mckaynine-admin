
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { APP_ID } from "@/constants/app";

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string | null;
  role: string;
  created_at: string;
  app_id?: string | null;
  isCurrentUser?: boolean;
}

export function useUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { 
    data: users = [], 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        // Get current user for marking in UI
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Get user IDs that have roles assigned in user_roles table
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id');
        
        if (rolesError) throw rolesError;
        
        const roleUserIds = [...new Set((userRoles || []).map(r => r.user_id))];
        
        // Get profiles matching app_id OR having user_roles entries
        let query = supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (roleUserIds.length > 0) {
          query = query.or(`app_id.eq.${APP_ID},id.in.(${roleUserIds.join(',')})`);
        } else {
          query = query.eq('app_id', APP_ID);
        }
        
        const { data: profiles, error } = await query;
        
        if (error) throw error;
        
        // Map to UserProfile format
        return (profiles || []).map(profile => ({
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
      } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60, // 1 minute
  });

  // Add user
  const addUser = useMutation({
    mutationFn: async ({ email, password, fullName, role }: { email: string; password: string; fullName: string; role: string }) => {
      try {
        console.log("Adding user:", email, fullName, role);
        
        // Get the current session token to pass as authorization
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error("Not authenticated");
        }
        
        // Use the edge function to create a user with admin privileges
        const { data, error } = await supabase.functions.invoke('user-role', {
          method: 'POST',
          body: { 
            operation: 'create_user',
            email, 
            password, 
            fullName, 
            role 
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (error) {
          console.error("Error from user-role function:", error);
          throw new Error(error.message || 'Failed to create user');
        }
        
        if (!data?.success) {
          console.error("User creation failed:", data);
          throw new Error(data?.error || 'User creation failed');
        }
        
        return data.user;
      } catch (error) {
        console.error("Error adding user:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "User created", description: "User has been created successfully" });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "User creation failed",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  });

  // Update user role
  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      try {
        // Get the current session token to pass as authorization
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error("Not authenticated");
        }
        
        const { error } = await supabase.functions.invoke('user-role', {
          method: 'POST',
          body: { userId, role },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (error) throw error;
        return { userId, role };
      } catch (error) {
        console.error("Error updating role:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Role updated", description: "User role has been updated successfully" });
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

  // Reset password
  const resetPassword = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      try {
        // Get the current session token to pass as authorization
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error("Not authenticated");
        }
        
        // Use the edge function or directly call admin API
        const { data, error } = await supabase.functions.invoke('user-role', {
          method: 'POST',
          body: { 
            operation: 'reset_password',
            userId, 
            password 
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        
        return { success: true };
      } catch (error) {
        console.error("Error resetting password:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Password reset", description: "Password has been reset successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Password reset failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    }
  });

  // Delete user
  const deleteUser = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error("Not authenticated");
        }
        
        const { data, error } = await supabase.functions.invoke('user-role', {
          method: 'POST',
          body: { 
            operation: 'delete_user',
            userId 
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        
        return { success: true };
      } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "User deleted", description: "User has been deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "User deletion failed",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  });

  return {
    users,
    isLoading,
    error,
    refetch,
    addUser,
    updateRole,
    resetPassword,
    deleteUser
  };
}
