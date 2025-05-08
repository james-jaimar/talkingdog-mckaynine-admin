
import { supabase } from "@/integrations/supabase/client";
import { ScheduleData } from "./types";
import { useToast } from "@/components/ui/use-toast";

export async function handleSingleTermSubmission(
  scheduleData: ScheduleData, 
  existingScheduleId: string | null,
  toast: ReturnType<typeof useToast>["toast"]
): Promise<void> {
  console.log("Processing single-term schedule");
  let result;
  
  if (existingScheduleId) {
    // Update existing schedule
    result = await supabase
      .from("class_schedules")
      .update(scheduleData)
      .eq("id", existingScheduleId);
      
    if (result.error) {
      console.error("Supabase update error:", result.error);
      throw result.error;
    }
    
    console.log("Schedule updated successfully:", result);
    
    toast({
      title: "Schedule updated",
      description: "The class schedule has been successfully updated.",
    });
  } else {
    // Create new schedule
    result = await supabase
      .from("class_schedules")
      .insert(scheduleData);
      
    if (result.error) {
      console.error("Supabase insert error:", result.error);
      throw result.error;
    }
    
    console.log("Schedule created successfully:", result);
    
    toast({
      title: "Schedule created",
      description: "The class schedule has been successfully created.",
    });
  }
}
