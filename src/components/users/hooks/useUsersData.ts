
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Trainer } from "@/components/trainers/types/trainer";

export type UserProfile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  email?: string;
  trainer?: Trainer | null;
};

export function useUsersData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [adminSetupAttempted, setAdminSetupAttempted] = useState<Record<string, boolean>>({});

  // Fetch all users with their profile information
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users-admin'],
    queryFn: async () => {
      try {
        // First get all profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (profilesError) {
          console.error("Error fetching user profiles:", profilesError);
          throw profilesError;
        }
        
        // Then get trainer information for users linked to trainers
        const userIds = profiles.map(profile => profile.id);
        
        const { data: trainers, error: trainersError } = await supabase
          .from('trainers')
          .select('*')
          .in('user_id', userIds);
          
        if (trainersError) {
          console.error("Error fetching trainers for users:", trainersError);
          // Don't throw, just continue with profiles data
        }
        
        // Join the data
        const usersWithTrainers = profiles.map(profile => {
          const linkedTrainer = trainers?.find(t => t.user_id === profile.id) || null;
          return {
            ...profile,
            trainer: linkedTrainer
          };
        });
        
        return usersWithTrainers as UserProfile[];
      } catch (error) {
        console.error("Error in users query:", error);
        throw error;
      }
    }
  });

  // Fetch trainers for linking to users
  const { data: trainers = [], isLoading: isLoadingTrainers } = useQuery({
    queryKey: ['trainers-for-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select('*');
      
      if (error) {
        console.error("Error fetching trainers:", error);
        throw error;
      }
      
      return data as Trainer[];
    }
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

  // Link trainer to user
  const linkTrainerToUser = async (userId: string, trainerId: string) => {
    try {
      // Update trainer record to link to this user
      const { error } = await supabase
        .from('trainers')
        .update({ user_id: userId })
        .eq('id', trainerId);
      
      if (error) throw error;

      toast({
        title: "Trainer linked",
        description: "User has been linked to the trainer profile.",
      });
      
      // Refresh both users and trainers data
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-for-users'] });
    } catch (error) {
      console.error("Error linking trainer to user:", error);
      toast({
        title: "Link failed",
        description: error instanceof Error ? error.message : "Failed to link trainer to user.",
        variant: "destructive",
      });
    }
  };

  // Unlink trainer from user
  const unlinkTrainerFromUser = async (userId: string, trainerId: string) => {
    try {
      // Update trainer record to remove user link
      const { error } = await supabase
        .from('trainers')
        .update({ user_id: null })
        .eq('id', trainerId)
        .eq('user_id', userId); // Double check it's the correct user
      
      if (error) throw error;

      toast({
        title: "Trainer unlinked",
        description: "User has been unlinked from the trainer profile.",
      });
      
      // Refresh both users and trainers data
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-for-users'] });
    } catch (error) {
      console.error("Error unlinking trainer from user:", error);
      toast({
        title: "Unlink failed",
        description: error instanceof Error ? error.message : "Failed to unlink trainer from user.",
        variant: "destructive",
      });
    }
  };

  // Set user with email as admin
  const setUserAsAdmin = async (email: string) => {
    // Skip if we've already attempted for this email in this session
    if (adminSetupAttempted[email]) {
      console.log(`Already attempted to set ${email} as admin in this session`);
      return null;
    }
    
    try {
      setAdminSetupAttempted(prev => ({ ...prev, [email]: true }));
      console.log("Attempting to set user as admin:", email);
      
      // First find the user by email in profiles
      // The username field in profiles table contains the email
      const { data: user, error: findError } = await supabase
        .from('profiles')
        .select('id, username, role')
        .eq('username', email)
        .maybeSingle();
      
      if (findError) {
        console.error("Error finding user by email:", findError);
        toast({
          title: "User not found",
          description: `Could not find user with email ${email}.`,
          variant: "destructive",
        });
        return null;
      }
      
      if (!user) {
        console.log("No user found with email:", email);
        
        // Try to find using case-insensitive search as fallback
        const { data: usersWithSimilarEmail, error: fallbackError } = await supabase
          .from('profiles')
          .select('id, username, role')
          .ilike('username', `%${email}%`);
        
        if (fallbackError || !usersWithSimilarEmail?.length) {
          console.log("No similar email found either:", email);
          toast({
            title: "User not found",
            description: `No user found with email ${email}. Please ensure the user has registered.`,
            variant: "destructive",
          });
          
          return null;
        }
        
        console.log("Found similar emails:", usersWithSimilarEmail);
      }
      
      // If we found the user, proceed with role update
      if (user) {
        console.log("Found user:", user);
        
        // Check if user is already an admin
        if (user.role === 'admin') {
          console.log("User is already an admin:", email);
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
      } else {
        toast({
          title: "User not found",
          description: `Could not find user with email ${email}.`,
          variant: "destructive",
        });
        
        return null;
      }
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
    trainers,
    isLoadingTrainers,
    linkTrainerToUser,
    unlinkTrainerFromUser,
  };
}
