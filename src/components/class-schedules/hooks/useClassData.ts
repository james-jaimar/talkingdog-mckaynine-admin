
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { useBranch } from "@/context/auth/useAuth";
import { Class } from "@/components/classes/types/class";

interface EnrichedClassData extends Class {
  start_date?: string;
  time?: string;
  location?: string;
  schedule_id?: string;
}

interface UseClassDataProps {
  classId?: string;
}

interface UseClassDataReturn {
  classData: EnrichedClassData | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  hasBranch: boolean;
  scheduleData: any | null;
}

export const useClassData = ({ classId }: UseClassDataProps): UseClassDataReturn => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const [classData, setClassData] = useState<EnrichedClassData | null>(null);
  const [scheduleData, setScheduleData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // First check if the classId is a schedule ID
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('class_schedules')
          .select(`
            *,
            classes:class_id (*)
          `)
          .eq('id', classId)
          .single();

        if (scheduleError && scheduleError.code !== 'PGRST116') {
          // If the error is not "no rows returned" then it's a real error
          console.error("Error fetching class schedule:", scheduleError);
          throw scheduleError;
        }

        if (scheduleData) {
          // We found a schedule, use its class data
          const classInfo = scheduleData.classes as Class;
          setScheduleData(scheduleData);
          
          // Create enriched class data with schedule-specific fields
          const enrichedClassData: EnrichedClassData = {
            ...classInfo,
            schedule_id: scheduleData.id,
            start_date: new Date(scheduleData.start_time).toLocaleDateString(),
            time: `${new Date(scheduleData.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(scheduleData.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            location: 'Main Branch' // Default location if not specified
          };
          
          setClassData(enrichedClassData);
          setIsLoading(false);
          return;
        }

        // If no schedule found, try fetching as a class ID directly
        const { data: directClassData, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('id', classId)
          .single();

        if (classError) {
          console.error("Error fetching class:", classError);
          throw classError;
        }

        // Set basic class data without schedule-specific fields
        setClassData(directClassData);
        setIsLoading(false);
      } catch (err) {
        console.error("Error in useClassData:", err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        setIsLoading(false);
      }
    };

    fetchClassData();
  }, [classId]);

  return {
    classData,
    scheduleData,
    isLoading,
    error,
    isAuthenticated: !!user,
    hasBranch: !!selectedBranch
  };
};
