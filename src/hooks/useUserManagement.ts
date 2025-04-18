
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { UserProfile } from "@/components/users/types/userTypes";
import { APP_ID } from "@/constants/app";

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
        
        // Get all profiles filtered by app_id
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('app_id', APP_ID)
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

  // Add User mutation
  const addUser = useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      fullName, 
      role 
    }: { 
      email: string; 
      password: string; 
      fullName: string; 
      role: string;
    }) => {
      console.log(`[useUserManagement] Creating new user with email: ${email}`);
      
      try {
        // Create the user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName }
        });
        
        if (authError) throw authError;
        if (!authData.user) throw new Error("User creation failed");
        
        const userId = authData.user.id;
        
        // Update the profile with role and app_id
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            full_name: fullName,
            role: role,
            app_id: APP_ID
          })
          .eq('id', userId);
        
        if (profileError) throw profileError;
        
        // If role is trainer, create trainer record
        if (role === 'trainer') {
          const names = fullName.split(' ');
          const firstName = names[0];
          const lastName = names.slice(1).join(' ');
          
          const { error: trainerError } = await supabase
            .from('trainers')
            .insert({
              user_id: userId,
              first_name: firstName,
              last_name: lastName || '',
              email: email
            });
            
          if (trainerError) {
            console.error("[useUserManagement] Error creating trainer record:", trainerError);
            // Don't throw, as the user is still created
          }
        }
        
        return authData.user;
      } catch (error) {
        console.error("[useUserManagement] Error creating user:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "User created",
        description: "User has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
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
      console.log(`[useUserManagement] Updating user ${userId} to role: ${role}`);
      
      try {
        // Call our edge function to handle role updates
        const { data, error } = await supabase.functions.invoke('manage-user-role', {
          method: 'POST',
          body: { userId, role },
        });
        
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
    addUser,
    updateRole,
    resetPassword
  };
}
