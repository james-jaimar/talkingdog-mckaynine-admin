
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isValid } from "date-fns";

export function useScheduleDates(classId: string) {
  return useQuery({
    queryKey: ['class-schedule-dates', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_schedules')
        .select('id, start_time, selected_dates')
        .eq('class_id', classId);
      
      if (error) throw error;
      
      // Extract unique dates from all schedules
      const dates = new Set<string>();
      
      data.forEach(schedule => {
        // Add the primary start date
        try {
          const dateObj = parseISO(schedule.start_time);
          if (isValid(dateObj)) {
            dates.add(schedule.start_time);
          }
        } catch (e) {
          console.error("Error parsing date:", schedule.start_time);
        }
        
        // Add any selected dates from recurring schedules
        if (schedule.selected_dates && Array.isArray(schedule.selected_dates)) {
          schedule.selected_dates.forEach((date: string) => {
            try {
              const dateObj = parseISO(date);
              if (isValid(dateObj)) {
                dates.add(date);
              }
            } catch (e) {
              console.error("Error parsing selected date:", date);
            }
          });
        }
      });
      
      return Array.from(dates).sort();
    },
    staleTime: 60000, // 1 minute
  });
}
