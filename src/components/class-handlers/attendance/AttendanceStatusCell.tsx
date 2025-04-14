
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, X, CalendarDays, AlertTriangle } from "lucide-react";

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
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 w-8 p-0" 
      onClick={() => onOpenAttendanceModal(booking, date)}
    >
      {status === 'present' && <Check className="h-4 w-4 text-green-600" />}
      {status === 'absent' && <X className="h-4 w-4 text-red-600" />}
      {status === 'excused' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
      {(status === 'not_marked' || !status) && <CalendarDays className="h-4 w-4 text-gray-400" />}
    </Button>
  );
}
