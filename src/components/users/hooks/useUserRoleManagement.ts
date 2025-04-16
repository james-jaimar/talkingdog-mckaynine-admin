
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { APP_ID } from "@/constants/app";

export function useUserRoleManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update user role
  const { mutate: updateUserRole, isPending: isUpdating } = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      console.log(`[useUserRoleManagement] Starting role update for user ${userId} to role: ${role}`);
      
      if (!userId || !role) {
        throw new Error("User ID and role are required");
      }
      
      try {
        // Start a transaction by getting user profile first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          console.error("[useUserRoleManagement] Error fetching profile:", profileError);
          throw new Error(`Failed to fetch user profile: ${profileError.message}`);
        }
        
        console.log("[useUserRoleManagement] Current profile:", profile);

        // Step 1: Update the profile with the new role
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role,
            app_id: APP_ID, // Ensure app_id is set
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        
        if (updateError) {
          console.error("[useUserRoleManagement] Error updating profile role:", updateError);
          throw updateError;
        }
        
        console.log("[useUserRoleManagement] Profile role updated successfully");
        
        // Step 2: Handle trainer-specific logic
        const isTrainerRole = role.includes('trainer');
        if (isTrainerRole) {
          console.log("[useUserRoleManagement] User assigned trainer role, syncing to trainers table");
          await syncUserToTrainersTable(userId, profile);
        }
        
        return { success: true, role, userId };
      } catch (error) {
        console.error("[useUserRoleManagement] Transaction failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("[useUserRoleManagement] Role update successful:", data);
      toast({
        title: "User role updated",
        description: `User role has been successfully updated to ${data.role}`,
      });
      
      // Invalidate and refetch relevant queries
      const queriesToInvalidate = [
        'users-admin',
        'admin-users-list',
        'users',
        'trainers-list'
      ];
      
      queriesToInvalidate.forEach(query => {
        queryClient.invalidateQueries({ queryKey: [query] });
        setTimeout(() => queryClient.refetchQueries({ queryKey: [query] }), 300);
      });
    },
    onError: (error: Error) => {
      console.error("[useUserRoleManagement] Role update failed:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update user role",
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
  console.log("[syncUserToTrainersTable] Starting sync for user:", userId);
  
  try {
    // Check if trainer record already exists
    const { data: existingTrainer, error: checkError } = await supabase
      .from('trainers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error("[syncUserToTrainersTable] Error checking trainer existence:", checkError);
      throw checkError;
    }
    
    // Parse name parts for trainer record
    const fullName = userProfile?.full_name || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    if (!existingTrainer) {
      console.log("[syncUserToTrainersTable] Creating new trainer record");
      
      const { error: createError } = await supabase
        .from('trainers')
        .insert({
          user_id: userId,
          email: userProfile.username || userProfile.email || '',
          first_name: firstName,
          last_name: lastName,
          specialties: [],
        });
        
      if (createError) {
        console.error("[syncUserToTrainersTable] Error creating trainer record:", createError);
        throw createError;
      }
      
      console.log("[syncUserToTrainersTable] Trainer record created successfully");
    } else {
      console.log("[syncUserToTrainersTable] Trainer record already exists");
    }
  } catch (error) {
    console.error("[syncUserToTrainersTable] Sync failed:", error);
    throw error;
  }
}
