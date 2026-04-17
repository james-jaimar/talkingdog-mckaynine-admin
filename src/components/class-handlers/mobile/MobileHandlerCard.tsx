import { Phone, Edit2, Check, X, AlertTriangle, CalendarDays, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Booking } from "../types/booking";
import { differenceInWeeks } from "date-fns";
import { useAttendance } from "../attendance/useAttendance";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useInvoiceStatus } from "../booking-row/useInvoiceStatus";
import { useMemo } from "react";

interface MobileHandlerCardProps {
  booking: Booking;
  selectedDate: string | null;
  classId: string;
  classType?: string;
  branchName?: string;
  onEdit: (booking: Booking) => void;
}

type AttendanceStatus = 'not_marked' | 'present' | 'absent' | 'excused';

export function MobileHandlerCard({ 
  booking, 
  selectedDate, 
  classId,
  classType,
  branchName,
  onEdit 
}: MobileHandlerCardProps) {
  const handler = booking.clients;
  const dog = booking.dogs;
  const { updateAttendance, isSubmitting } = useAttendance(classId);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const isRandburgPuppy = (branchName?.toLowerCase().includes('randburg') ?? false) && classType?.toLowerCase() === 'puppy';
  
  // Use same invoice status hook as desktop for accurate payment status
  const { data: invoiceData, isLoading: isLoadingInvoice } = useInvoiceStatus(booking.id);
  
  // Determine payment status from invoice data (same logic as PaymentStatusBadge)
  const paymentStatus = useMemo(() => {
    if (isLoadingInvoice) return { status: 'loading', display: 'Loading...', isPaid: false };
    if (!invoiceData) return { status: 'unpaid', display: 'Unpaid', isPaid: false };
    if (invoiceData.isPaid || invoiceData.invoices?.payment_received || invoiceData.invoices?.status === 'paid') {
      return { status: 'paid', display: 'Paid', isPaid: true };
    }
    if (invoiceData.invoices?.status === 'pending') {
      return { status: 'pending', display: 'Pending', isPaid: false };
    }
    return { status: 'unpaid', display: 'Unpaid', isPaid: false };
  }, [invoiceData, isLoadingInvoice]);

  // Calculate dog age in weeks
  const getDogAge = () => {
    if (!dog?.date_of_birth) return null;
    const weeks = differenceInWeeks(new Date(), new Date(dog.date_of_birth));
    return weeks;
  };

  const dogAge = getDogAge();

  // Get current attendance for selected date
  const getAttendanceRecord = () => {
    if (!selectedDate || !booking.attendances) return null;
    const dateToCheck = new Date(selectedDate).toDateString();
    return booking.attendances.find(
      (a: any) => new Date(a.class_date).toDateString() === dateToCheck
    );
  };

  const attendanceRecord = getAttendanceRecord();
  const currentStatus: AttendanceStatus = (attendanceRecord?.attendance_status as AttendanceStatus) || 'not_marked';
  const currentGrade = attendanceRecord?.performance_grade || null;

  // For Randburg Puppy: check if the selected date is in this handler's assigned window
  const isDateAssigned = useMemo(() => {
    if (!isRandburgPuppy) return true;
    const assigned = booking.assigned_dates || [];
    if (assigned.length === 0) return true; // no window set — fall back to allowing all
    if (!selectedDate) return true;
    const target = new Date(selectedDate).toDateString();
    return assigned.some(d => new Date(d).toDateString() === target);
  }, [isRandburgPuppy, booking.assigned_dates, selectedDate]);

  // Handle attendance button click (for non-Randburg present, and absent/excused)
  const handleAttendanceClick = async (newStatus: AttendanceStatus, grade?: string | null) => {
    if (!selectedDate || isSubmitting) return;

    // For Randburg numbered buttons, toggle off if same grade clicked
    if (isRandburgPuppy && grade && currentStatus === 'present' && currentGrade === grade) {
      // Toggle off
      try {
        await updateAttendance({
          bookingId: booking.id,
          classDate: selectedDate,
          status: 'not_marked',
          attendanceId: attendanceRecord?.id,
          performanceGrade: null
        });
        queryClient.invalidateQueries({ queryKey: ['class-handlers', classId] });
        toast({ title: 'Cleared', duration: 1500 });
      } catch (error) {
        console.error("Error updating attendance:", error);
        toast({ title: "Error updating attendance", variant: "destructive" });
      }
      return;
    }

    // Toggle off if already selected (non-Randburg or absent/excused)
    const statusToSet = (!grade && currentStatus === newStatus) ? 'not_marked' : newStatus;
    const gradeToSet = statusToSet === 'not_marked' ? null : (grade || null);

    try {
      await updateAttendance({
        bookingId: booking.id,
        classDate: selectedDate,
        status: statusToSet,
        attendanceId: attendanceRecord?.id,
        performanceGrade: gradeToSet
      });
      
      queryClient.invalidateQueries({ queryKey: ['class-handlers', classId] });
      
      const statusLabels: Record<string, string> = {
        present: 'Present',
        absent: 'Absent',
        excused: 'Excused',
        not_marked: 'Cleared'
      };
      
      toast({
        title: grade ? `Marked as Class ${grade}` : `Marked as ${statusLabels[statusToSet]}`,
        duration: 1500,
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast({ title: "Error updating attendance", variant: "destructive" });
    }
  };

  // Attendance button styles for absent/excused
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

  // Randburg numbered button style
  const getNumberButtonStyle = (num: string) => {
    const isActive = currentStatus === 'present' && currentGrade === num;
    const baseClasses = "h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-95 text-sm font-bold";
    return `${baseClasses} ${isActive ? 'bg-green-600 text-white shadow-lg' : 'bg-green-100 text-green-700 hover:bg-green-200'}`;
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
          {isRandburgPuppy && (booking.assigned_dates?.length ?? 0) > 0 && (
            <div className="text-xs text-muted-foreground mt-0.5">
              Assigned: {booking.assigned_dates!.length} of 6 sessions
            </div>
          )}
        </div>
        
        {/* Payment Status Badge */}
        {isLoadingInvoice ? (
          <Badge variant="outline" className="shrink-0 ml-2 bg-gray-100">
            <Loader2 className="h-3 w-3 animate-spin" />
          </Badge>
        ) : (
          <Badge 
            variant="outline" 
            className={`shrink-0 ml-2 ${
              paymentStatus.isPaid 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : paymentStatus.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  : 'bg-red-100 text-red-800 border-red-200'
            }`}
          >
            {paymentStatus.isPaid && <CheckCircle className="h-3 w-3 mr-1" />}
            {paymentStatus.display}
          </Badge>
        )}
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

      {/* Attendance Buttons - Only show if date is selected AND date is in handler's window */}
      {selectedDate && !isDateAssigned ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
            <CalendarDays className="h-4 w-4" />
            <span>Not part of this handler's session window</span>
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
      ) : selectedDate ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {isRandburgPuppy ? (
              <>
                {/* Numbered buttons 1-6 for Randburg */}
                {['1', '2', '3', '4', '5', '6'].map(num => (
                  <button
                    key={num}
                    onClick={() => handleAttendanceClick('present', num)}
                    disabled={isSubmitting}
                    className={getNumberButtonStyle(num)}
                    aria-label={`Mark class ${num}`}
                  >
                    {num}
                  </button>
                ))}
              </>
            ) : (
              <button
                onClick={() => handleAttendanceClick('present')}
                disabled={isSubmitting}
                className={getButtonStyle('present')}
                aria-label="Mark present"
              >
                <Check className="h-6 w-6" />
              </button>
            )}
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
            className="h-10 shrink-0"
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
