
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
import { useBranch } from "@/context/BranchContext";

interface AttendanceStatusCellProps {
  booking: any;
  date: string;
  classId: string;
  classType?: string;
  onOpenAttendanceModal?: (booking: any, date: string) => void;
}

// Default status cycle (non-Randburg)
const DEFAULT_STATUS_CYCLE: Array<string> = ['not_marked', 'present', 'absent', 'excused'];

// Randburg status cycle: not_marked -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> absent -> excused -> not_marked
const RANDBURG_STATUS_CYCLE: Array<string> = ['not_marked', '1', '2', '3', '4', '5', '6', 'absent', 'excused'];

export function AttendanceStatusCell({ booking, date, classId, classType, onOpenAttendanceModal }: AttendanceStatusCellProps) {
  const { updateAttendance, isSubmitting } = useAttendance(classId);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentBranch } = useBranch();
  
  const isRandburgPuppy = (currentBranch?.name?.toLowerCase().includes('randburg') ?? false) && classType?.toLowerCase() === 'puppy';
  const statusCycle = isRandburgPuppy ? RANDBURG_STATUS_CYCLE : DEFAULT_STATUS_CYCLE;

  // Function to get the attendance record for a booking and date
  const getAttendanceRecord = () => {
    if (!booking.attendances) return null;
    
    const dateToCheck = new Date(date).toDateString();
    const attendance = booking.attendances.find(
      (a: any) => new Date(a.class_date).toDateString() === dateToCheck
    );
    
    return attendance || null;
  };

  const attendanceRecord = getAttendanceRecord();
  
  // For Randburg, derive display status from performance_grade when present
  const getRandburgDisplayStatus = (): string => {
    if (!attendanceRecord) return 'not_marked';
    const status = attendanceRecord.attendance_status;
    if (status === 'present' && attendanceRecord.performance_grade) {
      return attendanceRecord.performance_grade; // "1", "2", etc.
    }
    if (status === 'absent') return 'absent';
    if (status === 'excused') return 'excused';
    if (status === 'present') return '1'; // Default to 1 if present but no grade
    return 'not_marked';
  };

  const displayStatus = isRandburgPuppy 
    ? getRandburgDisplayStatus()
    : (attendanceRecord?.attendance_status || 'not_marked');
  
  const performanceGrade = attendanceRecord?.performance_grade || null;

  const getNextStatus = (current: string): string => {
    const currentIndex = statusCycle.indexOf(current);
    const nextIndex = (currentIndex + 1) % statusCycle.length;
    return statusCycle[nextIndex];
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isSubmitting) return;

    const nextStatus = getNextStatus(displayStatus);
    
    // Determine attendance_status and performance_grade
    let attendanceStatus: string;
    let grade: string | null = null;
    
    if (isRandburgPuppy) {
      const numVal = parseInt(nextStatus);
      if (!isNaN(numVal) && numVal >= 1 && numVal <= 6) {
        attendanceStatus = 'present';
        grade = nextStatus;
      } else {
        attendanceStatus = nextStatus; // 'absent', 'excused', 'not_marked'
        grade = null;
      }
    } else {
      attendanceStatus = nextStatus;
      grade = null;
    }

    try {
      await updateAttendance({
        bookingId: booking.id,
        classDate: date,
        status: attendanceStatus,
        attendanceId: attendanceRecord?.id,
        performanceGrade: grade
      });
      
      queryClient.invalidateQueries({ queryKey: ['class-handlers', classId] });
      
      const statusLabels: Record<string, string> = {
        present: 'Present',
        absent: 'Absent', 
        excused: 'Excused',
        not_marked: 'Cleared',
        '1': 'Class 1', '2': 'Class 2', '3': 'Class 3',
        '4': 'Class 4', '5': 'Class 5', '6': 'Class 6'
      };
      
      toast({
        title: `Marked as ${statusLabels[nextStatus] || nextStatus}`,
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
    // Check if it's a number (Randburg present with grade)
    const numVal = parseInt(displayStatus);
    if (!isNaN(numVal) && numVal >= 1 && numVal <= 6) {
      return {
        icon: <span className="text-sm font-bold text-white">{numVal}</span>,
        label: `Present - Class ${numVal}`,
        bgColor: "bg-green-600 hover:bg-green-700"
      };
    }

    switch(displayStatus) {
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
