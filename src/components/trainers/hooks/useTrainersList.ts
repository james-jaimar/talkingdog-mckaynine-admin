
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trainer } from "../types/trainer";

export function useTrainersList() {
  return useQuery({
    queryKey: ['trainers-list'],
    queryFn: async () => {
      try {
        console.log("Fetching trainers from profiles table");
        
        // Perform a direct SQL query using Supabase to find profiles with 'trainer' in their role
        // This handles both exact 'trainer' matches and composite roles like 'admin,trainer'
        const { data: trainersProfiles, error: trainersError } = await supabase
          .from('profiles')
          .select('*')
          .or('role.eq.trainer,role.ilike.%trainer%');
        
        if (trainersError) throw trainersError;
        
        console.log("Found potential trainers:", trainersProfiles?.length);
        
        // Filter to ensure we only get profiles that actually contain 'trainer' as a role
        // This extra filter ensures we don't get false positives from the 'ilike' query
        const filteredTrainers = trainersProfiles?.filter(profile => {
          if (!profile.role) return false;
          
          // Check if 'trainer' exists as a standalone role or as part of a comma-separated list
          const roles = profile.role.split(',').map(r => r.trim().toLowerCase());
          return roles.includes('trainer');
        });
        
        console.log("Filtered trainers count:", filteredTrainers?.length);

        // Transform the data to match our Trainer interface
        const formattedTrainers: Trainer[] = filteredTrainers.map(profile => {
          // Properly handle multi-part names (e.g., "John Smith Johnson")
          const nameParts = profile.full_name?.split(' ') || ['', ''];
          const firstName = nameParts[0] || '';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
          
          return {
            id: profile.id,
            user_id: profile.id,
            first_name: firstName,
            last_name: lastName,
            email: profile.username || '',
            avatar_url: profile.avatar_url,
            phone: null,
            specialties: [],
            bio: null,
            branch_id: null,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          };
        });

        console.log("Final formatted trainers:", formattedTrainers);
        return formattedTrainers;
      } catch (error) {
        console.error("Error fetching trainers:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });
}
