
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, AlertTriangle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { useAttendance } from "./useAttendance";
import { useQueryClient } from "@tanstack/react-query";

interface AttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  classDate: string;
  classId: string;
  onAttendanceUpdated: () => void;
  isUpdating?: boolean; // Added the isUpdating prop as an optional boolean
}

export function AttendanceModal({
  open,
  onOpenChange,
  booking,
  classDate,
  classId,
  onAttendanceUpdated,
  isUpdating = false // Added with default value of false
}: AttendanceModalProps) {
  // Safely parse dates for comparison
  const safeParseDate = (dateString: string) => {
    try {
      return new Date(dateString).toDateString();
    } catch (e) {
      console.error("Error parsing date:", dateString, e);
      return "";
    }
  };
  
  // Find existing attendance record if any
  const existingAttendance = booking?.attendances?.find(
    (a: any) => safeParseDate(a.class_date) === safeParseDate(classDate)
  );
  
  const [status, setStatus] = useState(existingAttendance?.attendance_status || "not_marked");
  const [notes, setNotes] = useState(existingAttendance?.notes || "");
  const { toast } = useToast();
  const { updateAttendance, isSubmitting } = useAttendance(classId);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    try {
      await updateAttendance({
        bookingId: booking.id,
        classDate,
        status,
        notes,
        attendanceId: existingAttendance?.id
      });
      
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['class-handlers', classId] });
      
      toast({
        title: "Attendance updated",
        description: `Attendance for ${booking.dogs?.name || 'dog'} has been updated successfully.`,
        variant: "default"
      });
      
      // Call the callback to notify parent components
      onAttendanceUpdated();
      
      // Close the modal
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Reset form when modal opens with new data
  useEffect(() => {
    if (open) {
      setStatus(existingAttendance?.attendance_status || "not_marked");
      setNotes(existingAttendance?.notes || '');
    }
  }, [open, existingAttendance]);

  // Format date safely
  const getFormattedDate = () => {
    try {
      // Try to parse the date in different formats
      let dateObj;
      try {
        // First try ISO format
        dateObj = parseISO(classDate);
      } catch (e) {
        // If that fails, try direct Date constructor
        dateObj = new Date(classDate);
      }
      
      // If we have a valid date, format it
      if (!isNaN(dateObj.getTime())) {
        return format(dateObj, "EEEE, MMMM d, yyyy");
      }
      
      // Fallback to the raw string if parsing failed
      return classDate;
    } catch (e) {
      console.error("Date formatting error:", e);
      return classDate; // Return the original string if formatting fails
    }
  };
  
  const formattedDate = getFormattedDate();
  const handlerName = `${booking?.clients?.first_name || ''} ${booking?.clients?.last_name || ''}`.trim() || 'Unknown Handler';
  const dogName = booking?.dogs?.name || 'Unknown Dog';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Attendance</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <div className="font-medium">{dogName}</div>
            <div className="text-sm text-gray-500">{handlerName}</div>
            <div className="text-sm font-medium mt-2">Class Date: {formattedDate}</div>
          </div>
          
          <RadioGroup 
            value={status} 
            onValueChange={setStatus}
            className="grid grid-cols-1 gap-2 pt-2"
          >
            <div className="flex items-center space-x-2 border p-3 rounded-md">
              <RadioGroupItem value="present" id="present" />
              <Label htmlFor="present" className="flex items-center">
                <Check className="h-4 w-4 text-green-600 mr-2" /> Present
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 border p-3 rounded-md">
              <RadioGroupItem value="absent" id="absent" />
              <Label htmlFor="absent" className="flex items-center">
                <X className="h-4 w-4 text-red-600 mr-2" /> Absent
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 border p-3 rounded-md">
              <RadioGroupItem value="excused" id="excused" />
              <Label htmlFor="excused" className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" /> Excused
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 border p-3 rounded-md">
              <RadioGroupItem value="not_marked" id="not_marked" />
              <Label htmlFor="not_marked">Not Marked</Label>
            </div>
          </RadioGroup>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Add any notes about this attendance..."
              className="min-h-[80px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isUpdating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSubmitting || isUpdating}
          >
            {isSubmitting || isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
