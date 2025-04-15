
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
        .select('id, role, username')
        .eq('id', userId)
        .single();
      
      if (userCheckError || !userExists) {
        console.error("User not found:", userCheckError);
        throw new Error("User not found. Please refresh and try again.");
      }

      console.log("Current user profile:", userExists);
      
      try {
        // Step 1: Always update the profile with the new role first
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role })
          .eq('id', userId);
        
        if (profileError) {
          console.error("Error updating profile role:", profileError);
          throw profileError;
        }
        
        console.log("Profile role updated successfully to:", role);
        
        // Step 2: Handle trainer-specific logic
        if (role === 'trainer' || role.includes('trainer')) {
          console.log("Processing trainer role assignment");
          
          // Check if this user already exists in the trainers table
          const { data: existingTrainer, error: trainerCheckError } = await supabase
            .from('trainers')
            .select('id, user_id')
            .eq('user_id', userId);
            
          if (trainerCheckError) {
            console.error("Error checking trainer existence:", trainerCheckError);
          }
          
          // Get user details for creating trainer entry
          const { data: userData } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('id', userId)
            .single();
            
          if (!userData) {
            throw new Error("Failed to fetch user data for trainer creation");
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
            
            console.log("Trainer record created successfully");
          } else {
            console.log("Trainer record already exists for user:", userId);
          }
        } else if (role !== 'trainer' && !role.includes('trainer')) {
          // If changing from trainer to non-trainer role, check if we need to handle trainer record
          console.log("User is being changed to a non-trainer role");
          
          // Check if this user has a trainer record
          const { data: existingTrainer } = await supabase
            .from('trainers')
            .select('id')
            .eq('user_id', userId);
          
          // We'll leave the trainer record in place for data integrity
          // but log that it exists for debugging purposes
          if (existingTrainer && existingTrainer.length > 0) {
            console.log("Note: User has a trainer record that will remain in database for data integrity");
          }
        }
        
        return { role, userId };
      } catch (error) {
        console.error("Error in role update process:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      toast({
        title: "User updated",
        description: `User role has been updated to ${variables.role} successfully.`,
      });
      
      // Force invalidate all user and trainer queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-list'] });
      
      // Ensure the changes are immediately visible with a forced refetch
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['users-admin'] });
        queryClient.refetchQueries({ queryKey: ['admin-users-list'] });
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
