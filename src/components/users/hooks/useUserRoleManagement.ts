
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { APP_ID } from "@/constants/app";

export function useUserRoleManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: updateUserRole, isPending: isUpdating } = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      console.log(`[useUserRoleManagement] Starting role update for user ${userId} to role: ${role}`);
      
      if (!userId || !role) {
        throw new Error("User ID and role are required");
      }

      // Start transaction
      try {
        // Step 1: Get current profile to check existing role
        const { data: currentProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role, app_id')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error("[useUserRoleManagement] Error fetching current profile:", profileError);
          throw new Error(`Failed to fetch current profile: ${profileError.message}`);
        }

        console.log("[useUserRoleManagement] Current profile:", currentProfile);

        // Step 2: Update profile with new role
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role,
            app_id: APP_ID,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error("[useUserRoleManagement] Error updating profile:", updateError);
          throw new Error(`Failed to update profile: ${updateError.message}`);
        }

        // Step 3: Handle trainer table synchronization
        const isBecomingTrainer = role.includes('trainer');
        const wasTrainer = currentProfile?.role?.includes('trainer');

        if (isBecomingTrainer) {
          console.log("[useUserRoleManagement] Syncing trainer record");
          await syncTrainerRecord(userId);
        } else if (wasTrainer && !isBecomingTrainer) {
          console.log("[useUserRoleManagement] Removing trainer record");
          await removeTrainerRecord(userId);
        }

        return { success: true, role };
      } catch (error) {
        console.error("[useUserRoleManagement] Transaction failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("[useUserRoleManagement] Role update successful:", data);
      toast({
        title: "Role updated",
        description: `User role has been updated to ${data.role}`,
      });

      // Invalidate and refetch relevant queries
      const queriesToInvalidate = [
        ['users-admin'],
        ['admin-users-list'],
        ['users'],
        ['trainers-list']
      ];

      queriesToInvalidate.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
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

// Helper function to sync trainer record
async function syncTrainerRecord(userId: string) {
  try {
    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const nameParts = (profile?.full_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if trainer record exists
    const { data: existingTrainer, error: checkError } = await supabase
      .from('trainers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (!existingTrainer) {
      // Create new trainer record
      const { error: createError } = await supabase
        .from('trainers')
        .insert({
          user_id: userId,
          email: profile?.username || '',
          first_name: firstName,
          last_name: lastName,
          specialties: [],
        });

      if (createError) throw createError;
    }
  } catch (error) {
    console.error("[syncTrainerRecord] Error:", error);
    throw new Error('Failed to sync trainer record');
  }
}

// Helper function to remove trainer record
async function removeTrainerRecord(userId: string) {
  try {
    const { error } = await supabase
      .from('trainers')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error("[removeTrainerRecord] Error:", error);
    throw new Error('Failed to remove trainer record');
  }
}
