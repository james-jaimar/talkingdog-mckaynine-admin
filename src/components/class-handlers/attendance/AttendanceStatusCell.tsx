
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, X, CalendarDays, AlertTriangle } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AttendanceStatusCellProps {
  booking: any;
  date: string;
  onOpenAttendanceModal: (booking: any, date: string) => void;
}

export function AttendanceStatusCell({ booking, date, onOpenAttendanceModal }: AttendanceStatusCellProps) {
  // Function to get the attendance status for a booking and date
  const getAttendanceStatus = () => {
    if (!booking.attendances) return null;
    
    // Convert both dates to date string for comparison (ignoring time)
    const dateToCheck = new Date(date).toDateString();
    const attendance = booking.attendances.find(
      (a: any) => new Date(a.class_date).toDateString() === dateToCheck
    );
    
    return attendance ? attendance.attendance_status : 'not_marked';
  };

  const status = getAttendanceStatus();
  
  const getStatusDetails = () => {
    switch(status) {
      case 'present':
        return { 
          icon: <Check className="h-4 w-4 text-white" />,
          label: "Present", 
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
          label: "Mark Attendance", 
          bgColor: "bg-gray-100 hover:bg-gray-200"
        };
    }
  };
  
  const { icon, label, bgColor } = getStatusDetails();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 w-8 p-0 rounded-full ${bgColor}`}
            onClick={() => onOpenAttendanceModal(booking, date)}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
