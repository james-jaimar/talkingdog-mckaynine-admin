
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTerm } from "@/context/TermContext";

/**
 * Hook to identify and handle classes that span across multiple terms
 */
export function useClassTermSpanning(classId?: string) {
  const { termData } = useTerm();

  return useQuery({
    queryKey: ['class-term-spanning', classId, termData?.id],
    queryFn: async () => {
      if (!classId) return { isSpanning: false, terms: [] };
      
      console.log(`Checking if class ${classId} spans across multiple terms`);
      
      // Get the class schedules and their selected dates
      const { data: schedules, error } = await supabase
        .from('class_schedules')
        .select('id, selected_dates, start_time, end_time, term_id')
        .eq('class_id', classId);
        
      if (error) {
        console.error("Error checking class term spanning:", error);
        throw error;
      }
      
      if (!schedules || schedules.length === 0) {
        return { isSpanning: false, terms: [] };
      }
      
      // Get all relevant dates from schedules
      const allDates = schedules.flatMap(schedule => {
        if (schedule.selected_dates && schedule.selected_dates.length > 0) {
          return schedule.selected_dates.map(date => new Date(date));
        } else if (schedule.start_time) {
          return [new Date(schedule.start_time)];
        }
        return [];
      }).sort((a, b) => a.getTime() - b.getTime());
      
      if (allDates.length === 0) {
        return { isSpanning: false, terms: [] };
      }
      
      // Get the earliest and latest dates
      const earliestDate = allDates[0];
      const latestDate = allDates[allDates.length - 1];
      
      // Get all terms that overlap with the class date range
      const { data: terms, error: termsError } = await supabase
        .from('terms')
        .select(`
          id, 
          term_number, 
          start_date, 
          end_date,
          academic_years:academic_year_id(year)
        `)
        .lte('start_date', latestDate.toISOString().split('T')[0])
        .gte('end_date', earliestDate.toISOString().split('T')[0]);
        
      if (termsError) {
        console.error("Error checking terms for class spanning:", termsError);
        throw termsError;
      }
      
      const isSpanning = terms && terms.length > 1;
      
      console.log(`Class ${classId} spans across terms:`, isSpanning, terms);
      
      return {
        isSpanning,
        terms: terms || [],
        dateRange: {
          earliest: earliestDate,
          latest: latestDate
        }
      };
    },
    enabled: !!classId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
