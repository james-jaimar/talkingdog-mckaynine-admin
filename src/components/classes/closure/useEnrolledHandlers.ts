import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EnrolledHandler } from "./types";

export function useEnrolledHandlers(classId: string) {
  return useQuery({
    queryKey: ["enrolled-handlers-for-closure", classId],
    queryFn: async (): Promise<EnrolledHandler[]> => {
      // Get all class schedules for this class
      const { data: schedules, error: schedError } = await supabase
        .from("class_schedules")
        .select("id")
        .eq("class_id", classId);

      if (schedError) throw schedError;
      if (!schedules?.length) return [];

      const scheduleIds = schedules.map(s => s.id);

      // Get enrolled bookings with handler and dog info
      const { data: bookings, error: bookError } = await supabase
        .from("bookings")
        .select(`
          id,
          client_id,
          clients:client_id (
            id,
            first_name,
            last_name
          ),
          dogs:dog_id (
            name
          )
        `)
        .eq("is_enrolled", true)
        .in("class_schedule_id", scheduleIds);

      if (bookError) throw bookError;

      // Map to EnrolledHandler format
      return (bookings || []).map((b: any) => ({
        booking_id: b.id,
        handler_id: b.client_id,
        handler_name: b.clients ? `${b.clients.first_name} ${b.clients.last_name}` : "Unknown",
        dog_name: b.dogs?.name || "Unknown"
      }));
    },
    enabled: !!classId
  });
}
