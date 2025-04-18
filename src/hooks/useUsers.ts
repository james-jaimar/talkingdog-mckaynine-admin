
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
        
        // Get all profiles for this app
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('app_id', APP_ID)
          .order('created_at', { ascending: false });
        
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
        // Create the user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName }
        });
        
        if (authError) throw authError;
        if (!authData.user) throw new Error("User creation failed");
        
        // Update the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            full_name: fullName,
            role: role,
            app_id: APP_ID
          })
          .eq('id', authData.user.id);
        
        if (profileError) throw profileError;
        
        // Handle trainer role if needed
        if (role === 'trainer') {
          await createTrainerRecord(authData.user.id, email, fullName);
        }
        
        return authData.user;
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
        const { error } = await supabase.functions.invoke('user-role', {
          method: 'POST',
          body: { userId, role }
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
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          password: password
        });
        
        if (error) throw error;
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

  // Helper for trainer creation
  const createTrainerRecord = async (userId: string, email: string, fullName: string) => {
    const names = fullName.split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ');
    
    const { error } = await supabase
      .from('trainers')
      .insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName || '',
        email: email
      });
      
    if (error) {
      console.error("Error creating trainer record:", error);
      // Don't throw, as the user is still created
    }
  };

  return {
    users,
    isLoading,
    error,
    refetch,
    addUser,
    updateRole,
    resetPassword
  };
}
