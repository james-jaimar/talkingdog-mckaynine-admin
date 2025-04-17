
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { APP_ID } from "@/constants/app";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  app_id?: string;
  avatar_url?: string;
  created_at: string;
  isCurrentUser?: boolean;
  username?: string;
}

export interface UseUserManagementOptions {
  showAllUsers?: boolean;
  enabled?: boolean;
}

export function useUserManagement(options: UseUserManagementOptions = {}) {
  const { showAllUsers = false, enabled = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch users
  const {
    data: users = [],
    isLoading,
    isRefetching,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['users', { showAllUsers }],
    queryFn: async () => {
      try {
        console.log(`[useUserManagement] Fetching users (showAllUsers=${showAllUsers})`);
        
        // Get current user for marking in UI
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Build query
        let query = supabase.from('profiles').select('*');
        
        // Only filter by app_id when not showing all users
        if (!showAllUsers) {
          query = query.eq('app_id', APP_ID);
        }
        
        // Add ordering
        query = query.order('created_at', { ascending: false });
        
        const { data: profiles, error } = await query;
        
        if (error) {
          throw error;
        }
        
        // Transform to User format
        const userProfiles: User[] = (profiles || []).map(profile => ({
          id: profile.id,
          email: profile.username || '', // Email is stored in username field
          username: profile.username || '',
          full_name: profile.full_name || '',
          role: profile.role || 'user', // Ensure role is always set
          app_id: profile.app_id,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          isCurrentUser: currentUser?.id === profile.id
        }));
        
        return userProfiles;
      } catch (error) {
        console.error("[useUserManagement] Error:", error);
        throw error;
      }
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Count users without proper app_id
  const usersNeedingMigration = users.filter(user => 
    !user.app_id || user.app_id !== APP_ID
  ).length;

  // Update user role
  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      console.log(`[useUserManagement] Updating user ${userId} to role: ${role}`);
      
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
        console.error("[useUserManagement] Error:", error);
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

  // Reset user password
  const resetPassword = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      try {
        // Use edge function to reset password securely
        const { error } = await supabase.functions.invoke('update-user-role', {
          method: 'POST',
          body: { userId, password },
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

  // Add new user
  const addUser = useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      fullName, 
      role = 'user' 
    }: { 
      email: string; 
      password: string; 
      fullName?: string; 
      role?: string;
    }) => {
      try {
        // Step 1: Create user with Supabase Auth
        const { error: signupError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          }
        });
        
        if (signupError) throw signupError;
        
        // Step 2: Set up profile with role and app_id
        const userId = data.user?.id;
        if (!userId) throw new Error("Failed to create user");
        
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            username: email,
            full_name: fullName || "",
            role: role,
            app_id: APP_ID,
            updated_at: new Date().toISOString()
          });
        
        if (profileError) throw profileError;
        
        return { userId, email };
      } catch (error) {
        console.error("[useUserManagement] Error adding user:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "User added",
        description: "User has been created successfully",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add user",
        description: error.message || "An error occurred while adding the user",
        variant: "destructive",
      });
    }
  });

  // Update app_id for users (migration)
  const migrateUsers = useMutation({
    mutationFn: async (userIds: string[]) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ app_id: APP_ID })
          .in('id', userIds);
        
        if (error) throw error;
        
        return { count: userIds.length };
      } catch (error) {
        console.error("[useUserManagement] Error migrating users:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Users migrated",
        description: `${data.count} users have been migrated to this app`,
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Migration failed",
        description: error.message || "Failed to migrate users",
        variant: "destructive",
      });
    }
  });

  return {
    // Data
    users,
    usersNeedingMigration,
    
    // Loading states
    isLoading,
    isRefetching,
    isError,
    error,
    
    // Actions
    refetch,
    invalidateQueries: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    
    // Mutations
    updateRole,
    resetPassword,
    addUser,
    migrateUsers
  };
}
