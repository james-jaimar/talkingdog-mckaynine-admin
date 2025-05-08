
import { supabase } from "@/integrations/supabase/client";
import { ScheduleData, Term, ClassSchedule } from "./types";
import { filterDatesByTerm } from "./dateUtils";
import { useToast } from "@/components/ui/use-toast";

export async function handleMultiTermSubmission(
  baseScheduleData: ScheduleData,
  relatedTermIds: string[],
  schedule: ClassSchedule | null,
  toast: ReturnType<typeof useToast>["toast"]
): Promise<void> {
  console.log("Processing multi-term schedule");
  
  // Fetch details of the selected terms
  const { data: termsData, error: termsError } = await supabase
    .from("terms")
    .select("id, start_date, end_date")
    .in("id", relatedTermIds);
  
  if (termsError) {
    console.error("Error fetching terms:", termsError);
    throw termsError;
  }
  
  console.log("Terms data for multi-term schedule:", termsData);
  
  // Create a schedule for each term with the dates that fall within that term
  const scheduleInserts: ScheduleData[] = [];
  
  // Create a relation ID for linked schedules
  const relationId = crypto.randomUUID();
  
  for (const term of termsData) {
    const termStart = new Date(term.start_date);
    const termEnd = new Date(term.end_date);
    
    // Parse the dates from strings to Date objects
    const selectedDates = baseScheduleData.selected_dates.map(dateStr => new Date(dateStr));
    
    // Filter dates that fall within this term
    const termDates = filterDatesByTerm(selectedDates, termStart, termEnd);
    
    // Only create a schedule if there are dates for this term
    if (termDates.length > 0) {
      const termScheduleData: ScheduleData = {
        ...baseScheduleData,
        term_id: term.id,
        selected_dates: termDates.map(date => date.toISOString()),
        multi_term_relation_id: relationId,
        spans_multiple_terms: true
      };
      
      console.log(`Creating schedule for term ${term.id} with ${termDates.length} dates`);
      scheduleInserts.push(termScheduleData);
    }
  }
  
  // Handle the database operations
  if (scheduleInserts.length > 0) {
    if (schedule) {
      // If updating an existing multi-term schedule
      await handleExistingMultiTermSchedule(schedule, scheduleInserts);
    } else {
      // Create new multi-term schedules
      await createNewMultiTermSchedules(scheduleInserts);
    }
    
    toast({
      title: schedule ? "Schedules updated" : "Schedules created",
      description: `${schedule ? "Updated" : "Created"} ${scheduleInserts.length} schedules across multiple terms.`,
    });
  } else {
    throw new Error("No valid dates found for any of the selected terms");
  }
}

async function handleExistingMultiTermSchedule(schedule: ClassSchedule, scheduleInserts: ScheduleData[]) {
  // If updating an existing multi-term schedule, delete all related schedules first
  if (schedule.multi_term_relation_id) {
    const { error: deleteError } = await supabase
      .from("class_schedules")
      .delete()
      .eq("multi_term_relation_id", schedule.multi_term_relation_id);
    
    if (deleteError) {
      console.error("Error deleting related schedules:", deleteError);
      throw deleteError;
    }
  } else {
    // If it wasn't multi-term before, just delete the single schedule
    const { error: deleteError } = await supabase
      .from("class_schedules")
      .delete()
      .eq("id", schedule.id);
    
    if (deleteError) {
      console.error("Error deleting existing schedule:", deleteError);
      throw deleteError;
    }
  }
  
  // Now insert the new schedules
  const { data: insertedData, error: insertError } = await supabase
    .from("class_schedules")
    .insert(scheduleInserts)
    .select("id");
  
  if (insertError) {
    console.error("Error inserting new schedules:", insertError);
    throw insertError;
  }
  
  console.log("Updated multi-term schedules:", insertedData);
}

async function createNewMultiTermSchedules(scheduleInserts: ScheduleData[]) {
  const { data: insertedData, error: insertError } = await supabase
    .from("class_schedules")
    .insert(scheduleInserts)
    .select("id");
  
  if (insertError) {
    console.error("Error inserting new schedules:", insertError);
    throw insertError;
  }
  
  console.log("Created multi-term schedules:", insertedData);
}
