
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useScheduleDates(classId: string) {
  return useQuery({
    queryKey: ['schedule-dates', classId],
    queryFn: async () => {
      try {
        // Validate classId
        if (!classId) {
          console.error("Missing classId in useScheduleDates");
          throw new Error("Missing class ID");
        }
        
        // Get schedule for this class
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('class_schedules')
          .select('*')
          .eq('class_id', classId)
          .single();
          
        if (scheduleError) {
          console.error("Error fetching schedule:", scheduleError);
          throw scheduleError;
        }
          
        if (!scheduleData) {
          console.log("No schedule found for class:", classId);
          return [];
        }
          
        // Extract dates from schedule
        const { start_date, end_date, days_of_week } = scheduleData;
        
        // Validate dates
        if (!start_date || !end_date || !days_of_week) {
          console.error("Invalid schedule data:", scheduleData);
          return [];
        }
        
        // Parse days of week
        let daysArray: number[] = [];
        try {
          if (typeof days_of_week === 'string') {
            daysArray = JSON.parse(days_of_week);
          } else if (Array.isArray(days_of_week)) {
            daysArray = days_of_week;
          }
        } catch (e) {
          console.error("Error parsing days of week:", e);
          return [];
        }
        
        if (!Array.isArray(daysArray) || daysArray.length === 0) {
          console.error("Invalid days of week format:", days_of_week);
          return [];
        }
        
        // Generate dates
        const dates: string[] = [];
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        
        // Safety check for invalid dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error("Invalid date range:", { start_date, end_date });
          return [];
        }
        
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay();
          
          // Check if the current day is in the days_of_week array (0 = Sunday, 1 = Monday, etc.)
          if (daysArray.includes(dayOfWeek)) {
            dates.push(currentDate.toISOString());
          }
          
          // Move to next day
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
      } catch (error) {
        console.error("Error in useScheduleDates:", error);
        throw error;
      }
    },
    // Cache results for 5 minutes since schedule dates don't change often
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
