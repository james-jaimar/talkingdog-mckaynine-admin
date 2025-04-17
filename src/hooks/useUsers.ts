
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { APP_ID } from "@/constants/app";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  app_id?: string;
  avatar_url?: string;
  created_at: string;
  isCurrentUser?: boolean;
}

export interface UseUsersOptions {
  showAllUsers?: boolean;
}

export function useUsers(options: UseUsersOptions = {}) {
  const { showAllUsers = false } = options;
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['users', { showAllUsers }],
    queryFn: async () => {
      try {
        console.log(`[useUsers] Fetching users (showAllUsers=${showAllUsers})`);
        
        // Get current user for UI indication
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Build query
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
        
        // Transform to User format
        const userProfiles: User[] = (profiles || []).map(profile => ({
          id: profile.id,
          email: profile.username || '', // Email is stored in username field
          full_name: profile.full_name || '',
          role: profile.role || 'user',
          app_id: profile.app_id,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          isCurrentUser: currentUser?.id === profile.id
        }));
        
        return userProfiles;
      } catch (error) {
        console.error("[useUsers] Error:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Count users without proper app_id
  const usersNeedingMigration = users.filter(user => 
    !user.app_id || user.app_id !== APP_ID
  ).length;

  return {
    users,
    isLoading,
    isError,
    error,
    refetch,
    usersNeedingMigration,
    invalidateUsers: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  };
}
