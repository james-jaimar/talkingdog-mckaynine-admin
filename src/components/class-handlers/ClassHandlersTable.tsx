
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookingRow } from "./BookingRow";
import { useClassHandlers } from "./hooks/useClassHandlers";
import { useScheduleDates } from "./hooks/useScheduleDates";
import { useHandlerForm } from "./hooks/useHandlerForm";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, CalendarDays } from "lucide-react";
import { AttendanceModal } from "./attendance/AttendanceModal";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClassHandlersTableProps {
  classId: string;
}

export function ClassHandlersTable({ classId }: ClassHandlersTableProps) {
  const queryClient = useQueryClient();
  // Use our custom hooks
  const { data: handlers, isLoading: isLoadingHandlers, refetch } = useClassHandlers(classId);
  const { data: scheduleDates, isLoading: isLoadingDates } = useScheduleDates(classId);
  const { editingBookingId, formData, handleInputChange, startEditing, saveChanges, removeHandler } = useHandlerForm();
  
  // State for the remove confirmation dialog
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const [bookingToRemove, setBookingToRemove] = useState<string | null>(null);
  
  // State for attendance modal
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Ensure the component refetches when it mounts
  useEffect(() => {
    // Immediate refetch on mount
    refetch();
  }, [refetch]);

  const handleRemove = (bookingId: string) => {
    setBookingToRemove(bookingId);
    setOpenRemoveDialog(true);
  };

  const confirmRemove = async () => {
    if (bookingToRemove) {
      await removeHandler(bookingToRemove, classId);
      setBookingToRemove(null);
      setOpenRemoveDialog(false);
    }
  };

  const handleOpenAttendanceModal = (booking: any, date: string) => {
    setSelectedBooking(booking);
    setSelectedDate(date);
    setAttendanceModalOpen(true);
  };

  // Function to get the attendance status for a booking and date
  const getAttendanceStatus = (booking: any, date: string) => {
    if (!booking.attendances) return null;
    const attendance = booking.attendances.find(
      (a: any) => new Date(a.class_date).toDateString() === new Date(date).toDateString()
    );
    return attendance ? attendance.attendance_status : 'not_marked';
  };

  // Function to render attendance status cell
  const renderAttendanceStatus = (booking: any, date: string) => {
    const status = getAttendanceStatus(booking, date);
    
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0" 
        onClick={() => handleOpenAttendanceModal(booking, date)}
      >
        {status === 'present' && <Check className="h-4 w-4 text-green-600" />}
        {status === 'absent' && <X className="h-4 w-4 text-red-600" />}
        {status === 'excused' && <Check className="h-4 w-4 text-amber-500" />}
        {(status === 'not_marked' || !status) && <CalendarDays className="h-4 w-4 text-gray-400" />}
      </Button>
    );
  };

  if (isLoadingHandlers || isLoadingDates) {
    return <div className="text-center p-6">Loading class handlers...</div>;
  }

  if (!handlers || handlers.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-md border">
        <p className="text-muted-foreground">No handlers found for this class.</p>
        <p className="text-sm mt-2">Add handlers to this class to start tracking attendance.</p>
      </div>
    );
  }

  // Sort dates for consistency
  const sortedDates = scheduleDates ? [...scheduleDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime()) : [];

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Handler / Dog</TableHead>
              <TableHead className="text-center">Enrol</TableHead>
              <TableHead className="text-center">Vacc</TableHead>
              <TableHead>Payment</TableHead>
              {/* Attendance date columns */}
              {sortedDates && sortedDates.map((date) => (
                <TableHead key={date} className="text-center w-14">
                  <div className="flex flex-col items-center text-xs">
                    <span>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </TableHead>
              ))}
              <TableHead>Notes</TableHead>
              <TableHead>Info EO</TableHead>
              <TableHead className="text-center">WA</TableHead>
              <TableHead className="text-center">Social</TableHead>
              <TableHead>Info PG</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {handlers.map(booking => {
              const isEditing = editingBookingId === booking.id;
              const bookingData = formData[booking.id] || booking;
              
              return (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  isEditing={isEditing}
                  bookingData={bookingData}
                  handleInputChange={handleInputChange}
                  startEditing={startEditing}
                  saveChanges={(bookingId) => {
                    saveChanges(bookingId, classId);
                  }}
                  removeHandler={(bookingId) => handleRemove(bookingId)}
                  scheduleDates={sortedDates}
                  renderAttendanceStatus={renderAttendanceStatus}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={openRemoveDialog} onOpenChange={setOpenRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this handler from the class?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-red-600 hover:bg-red-700">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Attendance Modal */}
      {selectedBooking && selectedDate && (
        <AttendanceModal
          open={attendanceModalOpen}
          onOpenChange={setAttendanceModalOpen}
          booking={selectedBooking}
          classDate={selectedDate}
          classId={classId}
          onAttendanceUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['class-handlers', classId] });
          }}
        />
      )}
    </>
  );
}
