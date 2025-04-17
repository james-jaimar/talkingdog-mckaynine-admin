
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

  // Use a single query with configurable filtering
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
        console.log("[useUsersList] Current user:", currentUser?.id);
        
        // Get profiles with optional app_id filter
        let query = supabase.from('profiles').select('*');
        
        if (!showAllUsers) {
          console.log(`[useUsersList] Adding app_id filter: ${APP_ID}`);
          query = query.eq('app_id', APP_ID);
        } else {
          console.log("[useUsersList] Showing all users, skipping app_id filter");
        }
        
        // Add ordering
        query = query.order('created_at', { ascending: false });
        
        const { data: profiles, error } = await query;
        
        if (error) {
          console.error("[useUsersList] Error fetching profiles:", error);
          throw error;
        }
        
        console.log(`[useUsersList] Fetched ${profiles?.length || 0} user profiles`);
        
        // Log profile details for debugging
        if (profiles && profiles.length > 0) {
          console.log("[useUsersList] First profile:", profiles[0]);
          console.log("[useUsersList] All profiles app_ids:", profiles.map(p => ({ 
            id: p.id,
            username: p.username,
            app_id: p.app_id || 'null' 
          })));
          
          // Show users without app_id for debugging
          const withoutAppId = profiles.filter(p => !p.app_id);
          if (withoutAppId.length > 0) {
            console.log(`[useUsersList] Found ${withoutAppId.length} profiles without app_id`);
            console.log("[useUsersList] Profiles without app_id:", withoutAppId.map(p => p.username));
          }
          
          // Show users with different app_id
          const withDifferentAppId = profiles.filter(p => p.app_id && p.app_id !== APP_ID);
          if (withDifferentAppId.length > 0) {
            console.log(`[useUsersList] Found ${withDifferentAppId.length} profiles with different app_id`);
            console.log("[useUsersList] Profiles with different app_id:", withDifferentAppId.map(p => ({
              username: p.username,
              app_id: p.app_id
            })));
          }
        }
        
        // Transform profiles to UserProfile format
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
    enabled
  });

  // Count users without app_id
  const usersWithoutAppId = users.filter(user => !user.app_id).length;

  return {
    users,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
    usersWithoutAppId,
    invalidateQueries: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
    }
  };
}
