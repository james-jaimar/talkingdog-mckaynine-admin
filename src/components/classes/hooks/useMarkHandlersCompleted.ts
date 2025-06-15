
import { supabase } from "@/integrations/supabase/client";

interface Booking {
  id: string;
  client_id: string;
}

// Now ensure class_type is looked up and used
export async function useMarkHandlersCompleted(classId: string, currentTerm: string, classType: string) {
  // 1. Get enrolled bookings for this class
  const { data: classSchedulesData, error: classSchedulesError } = await supabase
    .from("class_schedules")
    .select("id")
    .eq("class_id", classId);

  const scheduleIds = classSchedulesData?.map(cs => cs.id) || [];

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, client_id")
    .eq("is_enrolled", true)
    .in("class_schedule_id", scheduleIds);

  if (bookingsError) throw bookingsError;
  if (!bookings || bookings.length === 0) return 0;

  // Fetch the class to get the correct class_type if it's empty/missing
  let classTypeToUse = classType;
  if (!classTypeToUse) {
    const { data: classData, error: classDataErr } = await supabase
      .from("classes")
      .select("class_type")
      .eq("id", classId)
      .maybeSingle();
    if (classData && classData.class_type) classTypeToUse = classData.class_type;
  }

  // 2. Upsert handler completions
  let completedCount = 0;
  for (const b of bookings as Booking[]) {
    // Only insert if not already completed (avoid double insert)
    const { data: already, error: alreadyErr } = await supabase
      .from("handler_class_status")
      .select("id")
      .eq("handler_id", b.client_id)
      .eq("class_id", classId)
      .eq("completed", true)
      .limit(1)
      .maybeSingle();
    if (!already && !alreadyErr) {
      await supabase.from("handler_class_status").insert({
        booking_id: b.id,
        class_id: classId,
        handler_id: b.client_id,
        class_type: classTypeToUse || "",
        completed: true,
        completed_at: new Date().toISOString(),
        completion_method: "auto",
        period: currentTerm,
      });
      completedCount++;
    }
  }
  return completedCount;
}

