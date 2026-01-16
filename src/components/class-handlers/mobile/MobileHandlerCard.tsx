import { Phone, Edit2, Check, X, AlertTriangle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Booking } from "../types/booking";
import { differenceInWeeks } from "date-fns";
import { useAttendance } from "../attendance/useAttendance";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MobileHandlerCardProps {
  booking: Booking;
  selectedDate: string | null;
  classId: string;
  onEdit: (booking: Booking) => void;
}

type AttendanceStatus = 'not_marked' | 'present' | 'absent' | 'excused';

export function MobileHandlerCard({ 
  booking, 
  selectedDate, 
  classId,
  onEdit 
}: MobileHandlerCardProps) {
  const handler = booking.clients;
  const dog = booking.dogs;
  const { updateAttendance, isSubmitting } = useAttendance(classId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Calculate dog age in weeks
  const getDogAge = () => {
    if (!dog?.date_of_birth) return null;
    const weeks = differenceInWeeks(new Date(), new Date(dog.date_of_birth));
    return weeks;
  };

  const dogAge = getDogAge();

  // Get current attendance status for selected date
  const getAttendanceStatus = (): AttendanceStatus => {
    if (!selectedDate || !booking.attendances) return 'not_marked';
    
    const dateToCheck = new Date(selectedDate).toDateString();
    const attendance = booking.attendances.find(
      (a: any) => new Date(a.class_date).toDateString() === dateToCheck
    );
    
    return (attendance?.attendance_status as AttendanceStatus) || 'not_marked';
  };

  const getAttendanceRecord = () => {
    if (!selectedDate || !booking.attendances) return null;
    
    const dateToCheck = new Date(selectedDate).toDateString();
    return booking.attendances.find(
      (a: any) => new Date(a.class_date).toDateString() === dateToCheck
    );
  };

  const currentStatus = getAttendanceStatus();
  const attendanceRecord = getAttendanceRecord();

  // Handle attendance button click
  const handleAttendanceClick = async (newStatus: AttendanceStatus) => {
    if (!selectedDate || isSubmitting) return;

    // Toggle off if already selected
    const statusToSet = currentStatus === newStatus ? 'not_marked' : newStatus;

    try {
      await updateAttendance({
        bookingId: booking.id,
        classDate: selectedDate,
        status: statusToSet,
        attendanceId: attendanceRecord?.id
      });
      
      queryClient.invalidateQueries({ queryKey: ['class-handlers', classId] });
      
      const statusLabels: Record<string, string> = {
        present: 'Present',
        absent: 'Absent',
        excused: 'Excused',
        not_marked: 'Cleared'
      };
      
      toast({
        title: `Marked as ${statusLabels[statusToSet]}`,
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

  // Attendance button styles
  const getButtonStyle = (status: AttendanceStatus) => {
    const isActive = currentStatus === status;
    const baseClasses = "h-12 w-12 rounded-full flex items-center justify-center transition-all active:scale-95";
    
    switch (status) {
      case 'present':
        return `${baseClasses} ${isActive ? 'bg-green-600 text-white shadow-lg' : 'bg-green-100 text-green-700 hover:bg-green-200'}`;
      case 'absent':
        return `${baseClasses} ${isActive ? 'bg-red-600 text-white shadow-lg' : 'bg-red-100 text-red-700 hover:bg-red-200'}`;
      case 'excused':
        return `${baseClasses} ${isActive ? 'bg-amber-500 text-white shadow-lg' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`;
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4 mb-3 shadow-sm">
      {/* Handler & Dog Info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">
            {handler?.first_name} {handler?.last_name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate">{dog?.name}</span>
            {dog?.breed && (
              <>
                <span>•</span>
                <span className="truncate">{dog.breed}</span>
              </>
            )}
            {dogAge !== null && (
              <>
                <span>•</span>
                <span className="whitespace-nowrap">{dogAge}w</span>
              </>
            )}
          </div>
        </div>
        
        {/* Payment Status Badge */}
        <Badge 
          variant="outline" 
          className={`shrink-0 ml-2 ${
            booking.computed_payment_status === 'paid' 
              ? 'bg-green-100 text-green-800 border-green-200' 
              : 'bg-red-100 text-red-800 border-red-200'
          }`}
        >
          {booking.computed_payment_status === 'paid' ? 'Paid' : 'Unpaid'}
        </Badge>
      </div>

      {/* Phone Number - Tappable */}
      {handler?.phone && (
        <a 
          href={`tel:${handler.phone}`}
          className="flex items-center gap-2 text-sm text-primary mb-3 active:opacity-70"
        >
          <Phone className="h-4 w-4" />
          <span>{handler.phone}</span>
        </a>
      )}

      {/* Attendance Buttons - Only show if date is selected */}
      {selectedDate ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAttendanceClick('present')}
              disabled={isSubmitting}
              className={getButtonStyle('present')}
              aria-label="Mark present"
            >
              <Check className="h-6 w-6" />
            </button>
            <button
              onClick={() => handleAttendanceClick('absent')}
              disabled={isSubmitting}
              className={getButtonStyle('absent')}
              aria-label="Mark absent"
            >
              <X className="h-6 w-6" />
            </button>
            <button
              onClick={() => handleAttendanceClick('excused')}
              disabled={isSubmitting}
              className={getButtonStyle('excused')}
              aria-label="Mark excused"
            >
              <AlertTriangle className="h-5 w-5" />
            </button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={() => onEdit(booking)}
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>Select a date to mark attendance</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={() => onEdit(booking)}
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      )}
    </div>
  );
}
