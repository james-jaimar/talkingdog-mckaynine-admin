
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
      
      // Check if user exists to provide better error messages
      const { data: userExists, error: userCheckError } = await supabase
        .from('profiles')
        .select('id, role, username, full_name')
        .eq('id', userId)
        .single();
      
      if (userCheckError || !userExists) {
        console.error("User not found:", userCheckError);
        throw new Error("User not found. Please refresh and try again.");
      }

      console.log("Current user profile:", userExists);
      
      // Step 1: Update the profile with the new role
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
      const isTrainerRole = role === 'trainer' || role.includes('trainer');
      
      if (isTrainerRole) {
        // Handle adding user to trainers table
        await syncUserToTrainersTable(userId, userExists);
      }
      
      return { role, userId };
    },
    onSuccess: (data) => {
      toast({
        title: "User updated",
        description: `User role has been updated to ${data.role} successfully.`,
      });
      
      // Invalidate and refetch relevant queries
      invalidateAndRefetchQueries(queryClient);
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

// Helper function to sync user to trainers table
async function syncUserToTrainersTable(userId: string, userProfile: any) {
  try {
    console.log("Syncing user to trainers table for user ID:", userId);
    
    // Check if this user already exists in the trainers table
    const { data: existingTrainer, error: trainerCheckError } = await supabase
      .from('trainers')
      .select('id')
      .eq('user_id', userId);
      
    if (trainerCheckError) {
      console.error("Error checking trainer existence:", trainerCheckError);
      throw trainerCheckError;
    }
    
    // Parse name parts
    const fullName = userProfile?.full_name || '';
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
          email: userProfile.username || '',
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
      console.log("Trainer record already exists for user ID:", userId);
    }
  } catch (error) {
    console.error("Error in syncUserToTrainersTable:", error);
    throw error;
  }
}

// Helper function to invalidate and refetch queries
function invalidateAndRefetchQueries(queryClient: any) {
  const queriesToInvalidate = [
    'users-admin', 
    'admin-users-list', 
    'users', 
    'trainers-list'
  ];
  
  // Invalidate all relevant queries
  queriesToInvalidate.forEach(query => {
    queryClient.invalidateQueries({ queryKey: [query] });
  });
  
  // Force refetch important queries after a short delay
  setTimeout(() => {
    queriesToInvalidate.forEach(query => {
      queryClient.refetchQueries({ queryKey: [query] });
    });
  }, 300);
}
