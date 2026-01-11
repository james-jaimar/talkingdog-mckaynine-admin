
import React from "react";
import { Check, X, CalendarDays, AlertTriangle } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAttendance } from "./useAttendance";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AttendanceStatusCellProps {
  booking: any;
  date: string;
  classId: string;
  onOpenAttendanceModal?: (booking: any, date: string) => void;
}

// Status cycle order: not_marked -> present -> absent -> excused -> not_marked
const STATUS_CYCLE: Array<'not_marked' | 'present' | 'absent' | 'excused'> = [
  'not_marked',
  'present', 
  'absent',
  'excused'
];

export function AttendanceStatusCell({ booking, date, classId, onOpenAttendanceModal }: AttendanceStatusCellProps) {
  const { updateAttendance, isSubmitting } = useAttendance(classId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Function to get the attendance record for a booking and date
  const getAttendanceRecord = () => {
    if (!booking.attendances) return null;
    
    // Convert both dates to date string for comparison (ignoring time)
    const dateToCheck = new Date(date).toDateString();
    const attendance = booking.attendances.find(
      (a: any) => new Date(a.class_date).toDateString() === dateToCheck
    );
    
    return attendance || null;
  };

  const attendanceRecord = getAttendanceRecord();
  const status = attendanceRecord?.attendance_status || 'not_marked';
  const performanceGrade = attendanceRecord?.performance_grade || null;

  const getNextStatus = (currentStatus: string): 'present' | 'absent' | 'excused' | 'not_marked' => {
    const currentIndex = STATUS_CYCLE.indexOf(currentStatus as any);
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
    return STATUS_CYCLE[nextIndex];
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isSubmitting) return;

    const nextStatus = getNextStatus(status);
    
    try {
      await updateAttendance({
        bookingId: booking.id,
        classDate: date,
        status: nextStatus,
        attendanceId: attendanceRecord?.id
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['class-handlers', classId] });
      
      // Show brief feedback
      const statusLabels: Record<string, string> = {
        present: 'Present',
        absent: 'Absent', 
        excused: 'Excused',
        not_marked: 'Cleared'
      };
      
      toast({
        title: `Marked as ${statusLabels[nextStatus]}`,
        duration: 1500,
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast({
        title: "Error updating attendance",
        variant: "destructive",
      });
    }
  };
  
  const getStatusDetails = () => {
    switch(status) {
      case 'present':
        return { 
          icon: <Check className="h-4 w-4 text-white" />,
          label: performanceGrade ? `Present - Grade ${performanceGrade}` : "Present", 
          bgColor: "bg-green-600 hover:bg-green-700"
        };
      case 'absent':
        return { 
          icon: <X className="h-4 w-4 text-white" />,
          label: "Absent", 
          bgColor: "bg-red-600 hover:bg-red-700"
        };
      case 'excused':
        return { 
          icon: <AlertTriangle className="h-4 w-4 text-white" />,
          label: "Excused Absence", 
          bgColor: "bg-amber-500 hover:bg-amber-600"
        };
      default:
        return { 
          icon: <CalendarDays className="h-4 w-4 text-gray-600" />,
          label: "Click to mark attendance", 
          bgColor: "bg-gray-100 hover:bg-gray-200"
        };
    }
  };
  
  const { icon, label, bgColor } = getStatusDetails();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={handleClick}
          >
            <div className={`h-8 w-8 p-0 rounded-full flex items-center justify-center ${bgColor} transition-colors`}>
              {icon}
            </div>
            {status === 'present' && performanceGrade && (
              <span className="text-xs font-semibold text-muted-foreground">
                {performanceGrade}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{label}</p>
          <p className="text-xs text-muted-foreground">Click to cycle status</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
