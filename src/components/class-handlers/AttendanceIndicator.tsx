
import { useState } from "react";
import { Check, X, Clock, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { attendanceToast } from "./AttendanceToast";

interface AttendanceIndicatorProps {
  bookingId: string;
  scheduleId: string;
  date: string;
  status: string;
}

export function AttendanceIndicator({ 
  bookingId, 
  scheduleId, 
  date, 
  status 
}: AttendanceIndicatorProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const getStatusIcon = () => {
    switch (status) {
      case 'present':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'absent':
        return <X className="h-5 w-5 text-red-600" />;
      case 'late':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'excused':
        return <X className="h-5 w-5 text-blue-600" />;
      case 'not_marked':
      default:
        return <HelpCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const updateAttendance = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      
      // Convert date string to full timestamp
      const classDate = new Date(date);
      // Set time to noon to avoid timezone issues
      classDate.setHours(12, 0, 0, 0);
      
      // Check if record already exists
      const { data: existingRecords, error: queryError } = await supabase
        .from('class_attendance')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('class_schedule_id', scheduleId)
        .gte('class_date', new Date(date).toISOString().split('T')[0])
        .lt(new Date(new Date(date).setDate(new Date(date).getDate() + 1)).toISOString().split('T')[0]);
      
      if (queryError) throw queryError;
      
      let result;
      
      if (existingRecords && existingRecords.length > 0) {
        // Update existing record
        result = await supabase
          .from('class_attendance')
          .update({ attendance_status: newStatus })
          .eq('id', existingRecords[0].id);
      } else {
        // Insert new record
        result = await supabase
          .from('class_attendance')
          .insert({
            booking_id: bookingId,
            class_schedule_id: scheduleId,
            class_date: classDate.toISOString(),
            attendance_status: newStatus
          });
      }
      
      if (result.error) throw result.error;
      
      // Using the correct TanStack Query v5 syntax for invalidateQueries
      queryClient.invalidateQueries({
        queryKey: ['class-attendance']
      });
      
      // Use our new toast utility that handles the type discrepancy
      attendanceToast(
        "Attendance updated",
        `Attendance marked as ${newStatus}`
      );
    } catch (error) {
      console.error('Error updating attendance:', error);
      // Use our new toast utility that handles the type discrepancy
      attendanceToast(
        "Error",
        "Failed to update attendance",
        "destructive"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={isUpdating} className="cursor-pointer">
        {getStatusIcon()}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => updateAttendance('present')}>
          <Check className="h-4 w-4 mr-2 text-green-600" />
          Present
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateAttendance('absent')}>
          <X className="h-4 w-4 mr-2 text-red-600" />
          Absent
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateAttendance('late')}>
          <Clock className="h-4 w-4 mr-2 text-amber-600" />
          Late
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateAttendance('excused')}>
          <X className="h-4 w-4 mr-2 text-blue-600" />
          Excused
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateAttendance('not_marked')}>
          <HelpCircle className="h-4 w-4 mr-2 text-gray-400" />
          Not Marked
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
