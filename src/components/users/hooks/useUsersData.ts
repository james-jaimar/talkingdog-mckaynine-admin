
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export type UserProfile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  email?: string; // From auth.users
};

export function useUsersData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch all users with their profile information
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users-admin'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) {
        console.error("Error fetching user profiles:", profilesError);
        throw profilesError;
      }

      // Enhance profiles with email from auth.users if needed
      // Note: This will only work if you have appropriate permissions
      // Typically, only service_role keys can access auth.users
      
      return profiles as UserProfile[];
    },
  });

  // Update user role
  const { mutate: updateUserRole, isPending: isUpdating } = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error("Error updating user role:", error);
        throw error;
      }
      
      return data;
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
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  // Set user with email as admin
  const setUserAsAdmin = async (email: string) => {
    try {
      console.log("Setting user as admin:", email);
      
      // First find the user by email
      const { data: user, error: findError } = await supabase
        .from('profiles')
        .select('id, username, role')
        .eq('username', email)
        .single();
      
      if (findError) {
        console.error("Error finding user:", findError);
        toast({
          title: "User not found",
          description: `Could not find user with email ${email}.`,
          variant: "destructive",
        });
        return null;
      }
      
      if (!user) {
        console.log("No user found with email:", email);
        toast({
          title: "User not found",
          description: `No user found with email ${email}.`,
          variant: "destructive",
        });
        return null;
      }
      
      console.log("Found user:", user);
      
      // Check if user is already an admin
      if (user.role === 'admin') {
        console.log("User is already an admin:", email);
        toast({
          title: "Already an admin",
          description: `User ${email} is already an administrator.`,
        });
        return user;
      }
      
      // Update the user role to admin
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)
        .select();
      
      if (error) {
        console.error("Error setting user as admin:", error);
        toast({
          title: "Update failed",
          description: error.message || "Failed to update user role to admin.",
          variant: "destructive",
        });
        return null;
      }
      
      console.log("Successfully set user as admin:", data);
      toast({
        title: "Admin privileges granted",
        description: `User ${email} is now an administrator.`,
      });
      
      // Refresh the users list
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      
      return data;
    } catch (error) {
      console.error("Unexpected error setting user as admin:", error);
      toast({
        title: "Operation failed",
        description: "An unexpected error occurred while setting the admin role.",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    users,
    isLoading,
    error,
    selectedUserId,
    setSelectedUserId,
    updateUserRole,
    isUpdating,
    setUserAsAdmin,
  };
}
