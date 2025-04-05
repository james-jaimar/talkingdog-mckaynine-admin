
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientWithDogs } from "@/types/customer-dashboard";
import { useAuth } from "@/context/auth";

export function useClientDashboardData() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        // First get client record by email
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select(`
            id,
            first_name,
            last_name,
            email,
            dogs (
              id,
              name,
              breed
            ),
            bookings:bookings (
              id,
              class_schedule_id,
              dog_id,
              class_schedule:class_schedules (
                id,
                start_time,
                class:classes (
                  id,
                  name,
                  description
                )
              )
            )
          `)
          .eq('email', user.email)
          .single();
          
        if (clientError) throw clientError;
        return clientData as ClientWithDogs;
      } catch (error) {
        console.error("Error fetching client data:", error);
        return null;
      }
    },
    enabled: !!user
  });
}

export const getUpcomingClasses = (clientData?: ClientWithDogs | null) => {
  if (!clientData?.bookings) return [];
  
  return clientData.bookings.filter(booking => {
    const classDate = new Date(booking.class_schedule.start_time);
    return classDate > new Date();
  });
};
