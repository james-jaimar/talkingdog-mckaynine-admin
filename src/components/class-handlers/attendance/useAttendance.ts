
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UpdateAttendanceParams {
  bookingId: string;
  classDate: string;
  status: string;
  notes?: string; // Keep this for backward compatibility with UI
  attendanceId?: string;
}

export function useAttendance(classId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const updateAttendance = async ({
    bookingId,
    classDate,
    status,
    notes, // Accept notes but don't use it since the column doesn't exist
    attendanceId
  }: UpdateAttendanceParams) => {
    setIsSubmitting(true);
    
    try {
      // Validate inputs
      if (!bookingId) throw new Error("Missing booking ID");
      if (!classDate) throw new Error("Missing class date");
      if (!status) throw new Error("Missing attendance status");
      
      console.log("Updating attendance:", {
        bookingId,
        classDate,
        status,
        attendanceId: attendanceId || "new record"
      });
      
      // First, get the class schedule id from the booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('class_schedule_id')
        .eq('id', bookingId)
        .single();
        
      if (bookingError) {
        console.error("Error fetching booking:", bookingError);
        throw bookingError;
      }
      
      if (!bookingData || !bookingData.class_schedule_id) {
        throw new Error("Invalid booking data - missing schedule ID");
      }
      
      const classScheduleId = bookingData.class_schedule_id;
      
      // Ensure we're using Date objects correctly - create a fresh instance and get ISO string
      let formattedDate: string;
      try {
        // Try to create a date object
        const dateObj = new Date(classDate);
        
        // Check if the date is valid
        if (isNaN(dateObj.getTime())) {
          throw new Error("Invalid date");
        }
        
        formattedDate = dateObj.toISOString();
      } catch (e) {
        console.error("Error formatting date:", e);
        // Fallback to the original string if we can't parse it
        formattedDate = classDate;
      }
      
      let result;
      
      if (attendanceId) {
        // Update existing attendance record
        // FIXED: Removed notes field from update
        console.log("Updating existing attendance record:", attendanceId);
        result = await supabase
          .from('class_attendance')
          .update({
            attendance_status: status,
            updated_at: new Date().toISOString()
          })
          .eq('id', attendanceId);
      } else {
        // Create new attendance record
        // FIXED: Removed notes field from insert
        console.log("Creating new attendance record");
        result = await supabase
          .from('class_attendance')
          .insert({
            booking_id: bookingId,
            class_schedule_id: classScheduleId,
            class_date: formattedDate,
            attendance_status: status
          });
      }
      
      // Check for errors in the result
      if (result.error) {
        console.error("Error in Supabase operation:", result.error);
        throw result.error;
      }
      
      console.log("Attendance updated successfully");
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
