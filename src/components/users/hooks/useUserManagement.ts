
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { UserProfile } from "../types/userTypes";
import { APP_ID } from "@/constants/app";

export function useUserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users for current app
  const {
    data: users = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['users-admin'],
    queryFn: async () => {
      console.log("Fetching users filtered by app_id:", APP_ID);

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

        return profiles.map(profile => ({
          id: profile.id,
          email: profile.username || '', // Ensure email is always set (from username field)
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
    }
  });

  // Handle role updates through the edge function
  const { mutate: updateRole } = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      console.log(`[useUserManagement] Updating role for user ${userId} to ${role}`);
      
      const { data, error } = await supabase.functions.invoke('manage-user-role', {
        method: 'POST',
        body: { userId, role },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      queryClient.invalidateQueries({ queryKey: ['trainers-list'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    users,
    isLoading,
    error,
    refetch,
    updateRole
  };
}
