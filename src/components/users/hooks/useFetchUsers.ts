
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "../types/userTypes";
import { APP_ID } from "@/constants/app";

export function useFetchUsers(options?: { includeAllUsers?: boolean }) {
  const includeAllUsers = options?.includeAllUsers || false;
  
  return useQuery({
    queryKey: ['admin-users-list', { includeAllUsers }],
    queryFn: async () => {
      const filteringMessage = includeAllUsers 
        ? "Fetching all users" 
        : `Fetching users filtered by app_id: ${APP_ID}`;
      console.log(filteringMessage);
      
      try {
        // Get current user for marking in the UI
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        console.log("Current user ID:", currentUser?.id);
        
        // Build query based on filtering option
        let query = supabase.from('profiles').select('*');
        
        if (!includeAllUsers) {
          console.log(`Adding app_id filter: ${APP_ID}`);
          query = query.eq('app_id', APP_ID);
        }
        
        // Add ordering and execute query
        query = query.order('created_at', { ascending: false });
        const { data: profiles, error } = await query;
        
        if (error) {
          console.error("Error fetching profiles:", error);
          throw error;
        }
        
        console.log(`Fetched ${profiles?.length || 0} profiles${includeAllUsers ? ' (all users)' : ''}`);
        
        if (profiles && profiles.length > 0) {
          console.log("Sample profile data:", profiles[0]);
        } else {
          console.warn("No profiles returned from query");
        }
        
        // Map profiles to UserProfile objects
        const userProfiles: UserProfile[] = (profiles || []).map(profile => ({
          id: profile.id,
          username: profile.username || "",
          email: profile.username || "", // Email is stored in username field
          full_name: profile.full_name || "",
          avatar_url: profile.avatar_url,
          role: profile.role || "user",
          created_at: profile.created_at,
          app_id: profile.app_id,
          isCurrentUser: currentUser?.id === profile.id
        }));
        
        console.log("Processed user profiles:", userProfiles.length);
        return userProfiles;
      } catch (error) {
        console.error("Error in useFetchUsers:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60, // 1 minute
  });
}
