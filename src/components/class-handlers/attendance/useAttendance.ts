
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UpdateAttendanceParams {
  bookingId: string;
  classDate: string;
  status: string;
  notes?: string;
  attendanceId?: string;
}

export function useAttendance(classId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const updateAttendance = async ({
    bookingId,
    classDate,
    status,
    notes,
    attendanceId
  }: UpdateAttendanceParams) => {
    setIsSubmitting(true);
    
    try {
      // First, get the class schedule id from the booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('class_schedule_id')
        .eq('id', bookingId)
        .single();
        
      if (bookingError) throw bookingError;
      
      const classScheduleId = bookingData.class_schedule_id;
      
      // Format the date properly to ensure consistency
      const formattedDate = new Date(classDate).toISOString();
      
      let result;
      
      if (attendanceId) {
        // Update existing attendance record
        result = await supabase
          .from('class_attendance')
          .update({
            attendance_status: status,
            notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', attendanceId);
      } else {
        // Create new attendance record
        result = await supabase
          .from('class_attendance')
          .insert({
            booking_id: bookingId,
            class_schedule_id: classScheduleId,
            class_date: formattedDate,
            attendance_status: status,
            notes
          });
      }
      
      // Check for errors in the result
      if (result.error) {
        console.error("Error in Supabase operation:", result.error);
        throw result.error;
      }
      
      return true;
    } catch (error) {
      console.error("Error updating attendance:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { updateAttendance, isSubmitting };
}
