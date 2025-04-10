
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "../types/userTypes";

export function useFetchUsers() {
  return useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      console.log("Fetching all users via edge function...");
      
      try {
        // Get current user for marking in the UI
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        console.log("Current user ID:", currentUser?.id);
        
        // Get current session for auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("No active session");
        }

        // Call the edge function to get all users
        const { data, error } = await supabase.functions.invoke("get-users", {
          method: 'GET'
        });
        
        if (error) {
          console.error("Edge function error:", error);
          throw new Error(`Failed to fetch users: ${error.message}`);
        }
        
        if (!data || !Array.isArray(data)) {
          console.error("Invalid response format:", data);
          throw new Error("Invalid response format from get-users function");
        }
        
        console.log("Raw profiles data retrieved:", data.length, "records");
        console.log("First few profiles:", data.slice(0, 3));
        
        if (data.length === 0) {
          console.warn("No profiles were returned from the edge function");
          return [];
        }
        
        // Map profiles to UserProfile objects
        const userProfiles: UserProfile[] = data.map(profile => ({
          id: profile.id,
          username: profile.username || "",
          full_name: profile.full_name || "",
          avatar_url: profile.avatar_url,
          role: profile.role || "user",
          created_at: profile.created_at,
          email: profile.username || "", // Email is stored in username field
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
