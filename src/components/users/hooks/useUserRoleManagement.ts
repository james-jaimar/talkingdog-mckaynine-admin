
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function useUserRoleManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update user role
  const { mutate: updateUserRole, isPending: isUpdating } = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      console.log(`Updating user ${userId} to role: ${role}`);
      
      if (!userId || !role) {
        throw new Error("User ID and role are required");
      }
      
      // First, check if user exists to provide better error messages
      const { data: userExists, error: userCheckError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .single();
      
      if (userCheckError || !userExists) {
        console.error("User not found:", userCheckError);
        throw new Error("User not found. Please refresh and try again.");
      }

      // Handle trainer role specifically
      if (role.includes('trainer')) {
        console.log("Processing trainer role assignment");
        
        // First update the profile with the new role
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role })
          .eq('id', userId);
        
        if (profileError) {
          console.error("Error updating profile role:", profileError);
          throw profileError;
        }
        
        // Check if this user already exists in the trainers table
        const { data: existingTrainer, error: trainerCheckError } = await supabase
          .from('trainers')
          .select('id, user_id')
          .eq('user_id', userId);
          
        if (trainerCheckError) {
          console.error("Error checking trainer existence:", trainerCheckError);
        }
        
        // Get user details for creating trainer entry
        const { data: userData, error: userDataError } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', userId)
          .single();
          
        if (userDataError) {
          console.error("Error fetching user data:", userDataError);
          throw userDataError;
        }
        
        // Parse name parts
        const fullName = userData?.full_name || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        
        // If trainer doesn't exist, create entry in trainers table
        if (!existingTrainer || existingTrainer.length === 0) {
          console.log("Creating new trainer record for user:", userId);
          
          const { error: createTrainerError } = await supabase
            .from('trainers')
            .insert({
              user_id: userId,
              email: userData.username || '',
              first_name: firstName,
              last_name: lastName,
              specialties: [],
            });
            
          if (createTrainerError) {
            console.error("Error creating trainer record:", createTrainerError);
            throw createTrainerError;
          }
        } else {
          console.log("Trainer record already exists for user:", userId);
        }
        
        return { role, userId };
      } else {
        // For non-trainer roles, just update the profile role
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role })
          .eq('id', userId);
        
        if (profileError) {
          console.error("Error updating user role:", profileError);
          throw profileError;
        }
        
        return { role, userId };
      }
    },
    onSuccess: (data, variables) => {
      toast({
        title: "User updated",
        description: `User role has been updated to ${variables.role} successfully.`,
      });
      
      // Force invalidate all user and trainer queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-list'] });
      
      // Ensure the changes are immediately visible with a forced refetch
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['users-admin'] });
        queryClient.refetchQueries({ queryKey: ['trainers-list'] });
      }, 500); // Longer delay to ensure DB changes are visible
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  return {
    updateUserRole,
    isUpdating
  };
}
