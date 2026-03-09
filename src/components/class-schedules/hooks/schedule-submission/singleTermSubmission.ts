
import { supabase } from "@/integrations/supabase/client";
import { ScheduleData } from "./types";
import { useToast } from "@/components/ui/use-toast";

export async function handleSingleTermSubmission(
  scheduleData: ScheduleData, 
  existingScheduleId: string | null,
  toast: ReturnType<typeof useToast>["toast"]
): Promise<void> {
  console.log("Processing single-term schedule");

  if (existingScheduleId) {
    const { data, error } = await supabase
      .from("class_schedules")
      .update(scheduleData)
      .eq("id", existingScheduleId)
      .select("id, term_id")
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }

    console.log("Schedule updated successfully:", data);
    if (data.term_id !== scheduleData.term_id) {
      console.warn("Term mismatch after update", {
        requestedTermId: scheduleData.term_id,
        persistedTermId: data.term_id,
        scheduleId: data.id,
      });
    }

    toast({
      title: "Schedule updated",
      description: "The class schedule has been successfully updated.",
    });
    return;
  }

  const { data, error } = await supabase
    .from("class_schedules")
    .insert(scheduleData)
    .select("id, term_id")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    throw error;
  }

  console.log("Schedule created successfully:", data);
  if (data.term_id !== scheduleData.term_id) {
    console.warn("Term mismatch after create", {
      requestedTermId: scheduleData.term_id,
      persistedTermId: data.term_id,
      scheduleId: data.id,
    });
  }

  toast({
    title: "Schedule created",
    description: "The class schedule has been successfully created.",
  });
}
