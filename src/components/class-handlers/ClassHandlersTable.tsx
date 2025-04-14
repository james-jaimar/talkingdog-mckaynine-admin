
import { Table, TableBody } from "@/components/ui/table";
import { BookingRow } from "./BookingRow";
import { useClassHandlers } from "./hooks/useClassHandlers";
import { useScheduleDates } from "./hooks/useScheduleDates";
import { useHandlerForm } from "./hooks/useHandlerForm";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { AttendanceModal } from "./attendance/AttendanceModal";
import { useAttendanceModal } from "./hooks/useAttendanceModal";
import { useRemoveHandler } from "./hooks/useRemoveHandler";
import { RemoveHandlerDialog } from "./RemoveHandlerDialog";
import { AttendanceStatusCell } from "./attendance/AttendanceStatusCell";
import { ClassHandlersTableHeader } from "./table/ClassHandlersTableHeader";

interface ClassHandlersTableProps {
  classId: string;
}

export function ClassHandlersTable({ classId }: ClassHandlersTableProps) {
  const queryClient = useQueryClient();
  
  // Use our custom hooks
  const { data: handlers, isLoading: isLoadingHandlers, refetch } = useClassHandlers(classId);
  const { data: scheduleDates, isLoading: isLoadingDates } = useScheduleDates(classId);
  const { editingBookingId, formData, handleInputChange, startEditing, saveChanges, removeHandler } = useHandlerForm();
  
  // Use the new hooks
  const { 
    openRemoveDialog, 
    setOpenRemoveDialog, 
    bookingToRemove,
    setBookingToRemove, 
    handleRemove 
  } = useRemoveHandler();
  
  const {
    attendanceModalOpen,
    setAttendanceModalOpen,
    selectedBooking,
    selectedDate,
    handleOpenAttendanceModal,
    handleAttendanceUpdated
  } = useAttendanceModal(classId);

  // Ensure the component refetches when it mounts and periodically
  useEffect(() => {
    // Immediate refetch on mount
    refetch();
    
    // Set up a periodic refresh
    const refreshInterval = setInterval(() => {
      refetch();
    }, 10000); // Refresh every 10 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [refetch]);

  const confirmRemove = async () => {
    if (bookingToRemove) {
      await removeHandler(bookingToRemove, classId);
      setBookingToRemove(null);
      setOpenRemoveDialog(false);
    }
  };

  // Render attendance status cell
  const renderAttendanceStatus = (booking: any, date: string) => {
    return (
      <AttendanceStatusCell
        booking={booking}
        date={date}
        onOpenAttendanceModal={handleOpenAttendanceModal}
      />
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
          <ClassHandlersTableHeader scheduleDates={sortedDates} />
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

      {/* Remove Handler Dialog */}
      <RemoveHandlerDialog
        open={openRemoveDialog}
        onOpenChange={setOpenRemoveDialog}
        onConfirm={confirmRemove}
      />

      {/* Attendance Modal */}
      {selectedBooking && selectedDate && (
        <AttendanceModal
          open={attendanceModalOpen}
          onOpenChange={setAttendanceModalOpen}
          booking={selectedBooking}
          classDate={selectedDate}
          classId={classId}
          onAttendanceUpdated={handleAttendanceUpdated}
        />
      )}
    </>
  );
}
