
import { ClassScheduleFormValues } from "../../schemas/classScheduleFormSchema";
import { ScheduleData } from "./types";
import { prepareDateTime } from "./dateUtils";
import { supabase } from "@/integrations/supabase/client";

type TermNumber = '1' | '2' | '3' | '4';

// Helper function to find the term_id for a given date
async function findTermForDate(date: Date): Promise<string | null> {
  const dateStr = date.toISOString().split('T')[0];

  const { data: term, error } = await supabase
    .from('terms')
    .select('id')
    .lte('start_date', dateStr)
    .gte('end_date', dateStr)
    .maybeSingle();

  if (error) {
    console.error("Error finding term for date:", error);
    return null;
  }

  return term?.id || null;
}

// Helper function to find term by currently selected year/term in UI
async function findTermForSelection(year: number, termNumber: TermNumber): Promise<string | null> {
  const { data, error } = await supabase
    .from('terms')
    .select(`
      id,
      academic_years!inner (
        year
      )
    `)
    .eq('academic_years.year', year)
    .eq('term_number', termNumber)
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error finding term by selected year/term:", error);
    return null;
  }

  return data?.id || null;
}

export async function prepareScheduleData(
  data: ClassScheduleFormValues,
  classId: string,
  currentTermId?: string | null,
  selectedYear?: number | null,
  selectedTermNumber?: TermNumber | null
): Promise<ScheduleData> {
  // Check if we have selected dates
  if (!data.selectedDates || data.selectedDates.length === 0) {
    throw new Error("Please select at least one date");
  }

  // Sort dates to find first and last
  const sortedDates = [...data.selectedDates].sort((a, b) => a.getTime() - b.getTime());
  const firstDate = sortedDates[0];

  // Set hours and minutes from time strings
  const startDateTime = prepareDateTime([firstDate], data.startTime);
  const endDateTime = prepareDateTime([firstDate], data.endTime);

  // If end time is earlier than start time, assume it's for the next day
  if (endDateTime < startDateTime) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  // Use the No Trainer ID constant for 'none' trainer selection
  const NO_TRAINER_ID = 'ba95153f-699c-4cc1-afe5-762bf30033d4';

  // Resolve term in this strict priority order:
  // 1) Explicit UI selected year/term (prevents stale termData.id race conditions)
  // 2) Current term context id
  // 3) Auto-detect from first selected date
  let termId: string | null = null;

  if (selectedYear && selectedTermNumber) {
    termId = await findTermForSelection(selectedYear, selectedTermNumber);
    console.log("Using selected year/term resolution:", { selectedYear, selectedTermNumber, termId });
  }

  if (!termId && currentTermId) {
    termId = currentTermId;
    console.log("Fallback to current term context term_id:", termId);
  }

  if (!termId) {
    termId = await findTermForDate(firstDate);
    console.log("Fallback to auto-determined term_id:", termId, "for date:", firstDate);
  }

  // Return the base schedule data
  return {
    class_id: classId,
    start_time: startDateTime.toISOString(),
    end_time: endDateTime.toISOString(),
    recurring: data.isRecurring,
    recurrence_pattern: data.referenceTitle,
    selected_dates: data.selectedDates.map(date => date.toISOString()),
    trainer_id: data.trainerId === 'none' ? NO_TRAINER_ID : data.trainerId,
    term_id: termId,
  };
}
