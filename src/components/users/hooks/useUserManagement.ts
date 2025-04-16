
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { UserProfile } from "../types/userTypes";
import { APP_ID } from "@/constants/app";

export function useUserManagement(options?: { includeAllUsers?: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const includeAllUsers = options?.includeAllUsers || false;

  // Fetch users for current app
  const {
    data: users = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['users-admin', { includeAllUsers }],
    queryFn: async () => {
      console.log(includeAllUsers ? "Fetching all users" : `Fetching users filtered by app_id: ${APP_ID}`);

      try {
        // Get current user for marking in UI
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Get profiles based on filtering option
        let query = supabase.from('profiles').select('*');
        
        // Only apply app_id filter if we're not including all users
        if (!includeAllUsers) {
          query = query.eq('app_id', APP_ID);
        }
        
        // Add ordering
        query = query.order('created_at', { ascending: false });
        
        const { data: profiles, error } = await query;
        
        if (error) throw error;

        console.log(`Fetched ${profiles?.length || 0} user profiles${includeAllUsers ? ' (all users)' : ''}`);

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
