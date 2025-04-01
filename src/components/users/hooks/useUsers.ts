
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export type User = {
  id: string;
  email: string; 
  full_name: string;
  role: string;
  created_at: string;
  isCurrentUser: boolean;
};

export function useUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  
  // Fetch users with current user flag
  const { 
    data: users = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['users-admin'],
    queryFn: async () => {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Fetch all profiles
      const { data, error } = await supabase.from('profiles').select('*');
      
      if (error) throw error;
      
      // Map to user objects with current user flag
      return (data || []).map(profile => ({
        id: profile.id,
        email: profile.username || '',
        full_name: profile.full_name || '',
        role: profile.role || 'user',
        created_at: profile.created_at,
        isCurrentUser: profile.id === currentUser?.id
      }));
    },
  });

  // Update user role
  const { mutate: updateUserRole, isPending: isUpdating } = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User role has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update user role.",
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
    },
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: "User password has been reset successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Reset failed",
        description: error instanceof Error ? error.message : "Failed to reset password.",
        variant: "destructive",
      });
    },
  });

  // Create new user
  const { mutate: createUser, isPending: isCreating } = useMutation({
    mutationFn: async ({ email, password, fullName }: { email: string; password: string; fullName: string }) => {
      const { error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "User created",
        description: "New user has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
    },
    onError: (error) => {
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Failed to create user.",
        variant: "destructive",
      });
    },
  });

  // Filter users
  const filteredUsers = users.filter(
    (user) =>
      (user.full_name?.toLowerCase() || '').includes(filter.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(filter.toLowerCase())
  );

  return {
    users,
    filteredUsers,
    filter,
    setFilter,
    isLoading,
    error,
    updateUserRole,
    isUpdating,
    resetPassword,
    isResetting,
    createUser,
    isCreating,
    refetch
  };
}
