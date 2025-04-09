
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "../types/userTypes";

export function useFetchUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      console.log("Fetching users from profiles table - START");
      
      try {
        // Get current user for marking in the UI
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        console.log("Current user ID:", currentUser?.id);
        
        console.log("About to execute Supabase query to profiles table");
        
        // Debug the request being made
        const profilesQuery = supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        console.log("Query being executed:", profilesQuery);
        
        // Get all users from the profiles table
        const { data: profiles, error, status, statusText, count } = await profilesQuery;
        
        console.log("Query response:", { status, statusText, count, error });
          
        if (error) {
          console.error("Error fetching profiles:", error);
          throw error;
        }
        
        console.log("Raw profiles data:", profiles);
        console.log(`Successfully fetched ${profiles?.length || 0} user profiles`);
        
        // If we only got one profile, let's double check if that's expected
        if (profiles?.length === 1) {
          console.log("Only one profile was returned. Let's check if that's expected:");
          
          // Test a simpler query to see if there are actually more profiles
          const countCheck = await supabase.from('profiles').select('id', { count: 'exact' });
          console.log("Total profiles count check:", countCheck);
        }
        
        // Map to UserProfile objects
        const userProfiles: UserProfile[] = (profiles || []).map(profile => {
          return {
            id: profile.id,
            username: profile.username || "",
            full_name: profile.full_name || "",
            avatar_url: profile.avatar_url,
            role: profile.role || "user",
            created_at: profile.created_at,
            email: profile.username, // Email is stored in username field
            isCurrentUser: currentUser?.id === profile.id
          };
        });
        
        console.log("Processed user profiles:", userProfiles);
        console.log(`Total processed profiles: ${userProfiles.length}`);
        console.log("Fetching users from profiles table - END");
        
        return userProfiles;
      } catch (error) {
        console.error("Error in useFetchUsers:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60, // 1 minute
  });
}
