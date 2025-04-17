
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "../types/userTypes";
import { APP_ID } from "@/constants/app";

interface UseUsersListOptions {
  showAllUsers?: boolean;
  enabled?: boolean;
}

export function useUsersList(options: UseUsersListOptions = {}) {
  const { showAllUsers = false, enabled = true } = options;
  const queryClient = useQueryClient();

  // Use a query with a key that includes showAllUsers to ensure cache updates when that changes
  const {
    data: users = [],
    isLoading,
    isRefetching,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['users-list', { showAllUsers }],
    queryFn: async () => {
      try {
        console.log(`[useUsersList] Fetching users (showAllUsers=${showAllUsers})`);
        
        // Get current user for marking in UI
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Build query - we always select all columns
        let query = supabase.from('profiles').select('*');
        
        // Only filter by app_id when not showing all users
        if (!showAllUsers) {
          query = query.eq('app_id', APP_ID);
        }
        
        // Add ordering
        query = query.order('created_at', { ascending: false });
        
        const { data: profiles, error } = await query;
        
        if (error) {
          throw error;
        }
        
        console.log(`[useUsersList] Fetched ${profiles?.length || 0} user profiles`);
        
        // Transform to UserProfile format
        const userProfiles: UserProfile[] = (profiles || []).map(profile => ({
          id: profile.id,
          email: profile.username || '', // Email is stored in username field
          username: profile.username || '',
          full_name: profile.full_name || '',
          role: profile.role || 'user',
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          app_id: profile.app_id,
          isCurrentUser: currentUser?.id === profile.id
        }));
        
        return userProfiles;
      } catch (error) {
        console.error("[useUsersList] Error:", error);
        throw error;
      }
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Count users without app_id
  const usersWithoutAppId = users.filter(user => !user.app_id).length;
  // Count users with wrong app_id
  const usersWithWrongAppId = users.filter(user => user.app_id && user.app_id !== APP_ID).length;
  // Total users needing migration
  const usersNeedingMigration = usersWithoutAppId + usersWithWrongAppId;

  return {
    users,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
    usersWithoutAppId,
    usersWithWrongAppId,
    usersNeedingMigration,
    invalidateQueries: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
    }
  };
}
