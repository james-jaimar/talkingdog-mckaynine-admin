
import { useState } from "react";
import { Check, X, Clock, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
      const { data: existingRecords } = await supabase
        .from('class_attendance')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('class_schedule_id', scheduleId)
        .gte('class_date', new Date(date).toISOString().split('T')[0])
        .lt(new Date(new Date(date).setDate(new Date(date).getDate() + 1)).toISOString().split('T')[0]);
      
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
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['class-attendance'] });
      
      toast({
        title: "Attendance updated",
        description: `Attendance marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
      });
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
