
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, AlertTriangle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAttendance } from "./useAttendance";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface BatchAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookings: any[];
  scheduleDates: string[];
  classId: string;
  classType?: string;
  branchName?: string;
  onAttendanceUpdated: () => void;
}

type AttendanceStatus = 'not_marked' | 'present' | 'absent' | 'excused';

interface AttendanceRecord {
  bookingId: string;
  status: AttendanceStatus;
  existingAttendanceId?: string;
  performanceGrade?: string | null;
}

export function BatchAttendanceModal({
  open,
  onOpenChange,
  bookings,
  scheduleDates,
  classId,
  classType,
  branchName,
  onAttendanceUpdated
}: BatchAttendanceModalProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { updateAttendance } = useAttendance(classId);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const isRandburgPuppy = (branchName?.toLowerCase().includes('randburg') ?? false) && classType?.toLowerCase() === 'puppy';
  
  // Format date for display
  const formatDateOption = (dateString: string) => {
    try {
      return format(new Date(dateString), "EEEE, MMMM d, yyyy");
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };
  
  // Sort dates in ascending order
  const sortedDates = [...scheduleDates].sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );
  
  // Initialize with the first date
  useEffect(() => {
    if (open && sortedDates.length > 0 && !selectedDate) {
      setSelectedDate(sortedDates[0]);
    }
  }, [open, sortedDates, selectedDate]);
  
  // Reset records when date changes
  useEffect(() => {
    if (selectedDate) {
      initializeAttendanceRecords();
    }
  }, [selectedDate]);
  
  // Initialize attendance records from existing data
  const initializeAttendanceRecords = () => {
    if (!selectedDate) return;
    
    const safeParseDate = (dateString: string) => {
      try {
        return new Date(dateString).toDateString();
      } catch (e) {
        console.error("Error parsing date:", e);
        return "";
      }
    };
    
    const newRecords: Record<string, AttendanceRecord> = {};
    
    bookings.forEach(booking => {
      const existingAttendance = booking?.attendances?.find(
        (a: any) => safeParseDate(a.class_date) === safeParseDate(selectedDate)
      );
      
      newRecords[booking.id] = {
        bookingId: booking.id,
        status: existingAttendance?.attendance_status || 'not_marked',
        existingAttendanceId: existingAttendance?.id,
        performanceGrade: existingAttendance?.performance_grade || null
      };
    });
    
    setAttendanceRecords(newRecords);
  };
  
  // Update status for a booking
  const updateStatus = (bookingId: string, status: AttendanceStatus, grade?: string | null) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        status,
        performanceGrade: grade !== undefined ? grade : null
      }
    }));
  };
  
  // Save all attendance records
  const saveAllAttendance = async () => {
    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Please select a date to mark attendance",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const recordsToSave = Object.values(attendanceRecords);
      
      for (const record of recordsToSave) {
        await updateAttendance({
          bookingId: record.bookingId,
          classDate: selectedDate,
          status: record.status,
          attendanceId: record.existingAttendanceId,
          performanceGrade: record.performanceGrade
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['class-handlers', classId] });
      
      toast({
        title: "Attendance updated",
        description: `Attendance for ${recordsToSave.length} handlers has been updated.`,
        variant: "default"
      });
      
      onAttendanceUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get icon color based on status
  const getIconColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'text-green-600';
      case 'absent': return 'text-red-600';
      case 'excused': return 'text-amber-500';
      default: return 'text-gray-400';
    }
  };
  
  // Get background color for status buttons
  const getButtonBgColor = (bookingId: string, buttonStatus: AttendanceStatus, grade?: string) => {
    const record = attendanceRecords[bookingId];
    if (!record) return 'bg-white';
    
    // For Randburg numbered buttons
    if (grade && record.status === 'present' && record.performanceGrade === grade) {
      return 'bg-green-100 border-green-600';
    }
    
    // For standard buttons (non-grade)
    if (!grade && record.status === buttonStatus) {
      switch (buttonStatus) {
        case 'present': return 'bg-green-100 border-green-600';
        case 'absent': return 'bg-red-100 border-red-600';
        case 'excused': return 'bg-amber-100 border-amber-500';
        default: return 'bg-gray-100 border-gray-400';
      }
    }
    return 'bg-white';
  };
  
  if (!selectedDate) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[85%]" : "max-w-md"}>
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Batch Attendance
          </SheetTitle>
        </SheetHeader>
        
        <div className="py-4">
          <Label htmlFor="date-select">Select Class Date</Label>
          <Select
            value={selectedDate}
            onValueChange={setSelectedDate}
          >
            <SelectTrigger id="date-select" className="mt-1">
              <SelectValue placeholder="Select a date">
                {selectedDate ? formatDateOption(selectedDate) : "Select a date"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sortedDates.map((date) => (
                <SelectItem key={date} value={date}>
                  {formatDateOption(date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col space-y-1 mt-2 overflow-y-auto" style={{ maxHeight: isMobile ? 'calc(100% - 180px)' : '400px' }}>
          {bookings.map(booking => {
            const handler = booking.clients;
            const dog = booking.dogs;
            
            return (
              <div 
                key={booking.id} 
                className="p-3 border rounded-lg mb-2"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm md:text-base">
                      {handler?.first_name} {handler?.last_name}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">
                      {dog?.name} ({dog?.breed})
                    </div>
                  </div>
                  
                  <div className="flex space-x-1 md:space-x-2 flex-wrap justify-end gap-y-1">
                    {isRandburgPuppy ? (
                      <>
                        {['1', '2', '3', '4', '5', '6'].map(num => (
                          <Button
                            key={num}
                            type="button"
                            size="sm"
                            variant="outline"
                            className={`${getButtonBgColor(booking.id, 'present', num)} h-9 w-9 p-0 rounded-full text-sm font-bold`}
                            onClick={() => updateStatus(booking.id, 'present', num)}
                          >
                            <span className={attendanceRecords[booking.id]?.status === 'present' && attendanceRecords[booking.id]?.performanceGrade === num ? 'text-green-700' : 'text-green-600'}>{num}</span>
                          </Button>
                        ))}
                      </>
                    ) : (
                      <Button
                        type="button"
                        size={isMobile ? "sm" : "default"}
                        variant="outline"
                        className={`${getButtonBgColor(booking.id, 'present')} h-10 w-10 p-0 rounded-full`}
                        onClick={() => updateStatus(booking.id, 'present')}
                      >
                        <Check className={`h-5 w-5 ${getIconColor('present')}`} />
                        <span className="sr-only">Mark as present</span>
                      </Button>
                    )}
                    
                    <Button
                      type="button"
                      size={isMobile ? "sm" : "default"}
                      variant="outline"
                      className={`${getButtonBgColor(booking.id, 'absent')} h-10 w-10 p-0 rounded-full`}
                      onClick={() => updateStatus(booking.id, 'absent', null)}
                    >
                      <X className={`h-5 w-5 ${getIconColor('absent')}`} />
                      <span className="sr-only">Mark as absent</span>
                    </Button>
                    
                    <Button
                      type="button"
                      size={isMobile ? "sm" : "default"}
                      variant="outline"
                      className={`${getButtonBgColor(booking.id, 'excused')} h-10 w-10 p-0 rounded-full`}
                      onClick={() => updateStatus(booking.id, 'excused', null)}
                    >
                      <AlertTriangle className={`h-5 w-5 ${getIconColor('excused')}`} />
                      <span className="sr-only">Mark as excused</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <SheetFooter className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={saveAllAttendance} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save All'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
