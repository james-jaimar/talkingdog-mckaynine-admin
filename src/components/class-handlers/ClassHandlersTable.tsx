
import { Table, TableBody } from "@/components/ui/table";
import { BookingRow } from "./BookingRow";
import { useClassHandlers } from "./hooks/useClassHandlers";
import { useScheduleDates } from "./hooks/useScheduleDates";
import { useHandlerForm } from "./hooks/useHandlerForm";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AttendanceModal } from "./attendance/AttendanceModal";
import { useAttendanceModal } from "./hooks/useAttendanceModal";
import { useRemoveHandler } from "./hooks/useRemoveHandler";
import { RemoveHandlerDialog } from "./RemoveHandlerDialog";
import { AttendanceStatusCell } from "./attendance/AttendanceStatusCell";
import { ClassHandlersTableHeader } from "./table/ClassHandlersTableHeader";
import { Loader2, Users, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BatchAttendanceModal } from "./attendance/BatchAttendanceModal";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ClassHandlersTableProps {
  classId: string;
}

export function ClassHandlersTable({ classId }: ClassHandlersTableProps) {
  const queryClient = useQueryClient();
  const [initialLoadAttempted, setInitialLoadAttempted] = useState<boolean>(false);
  const [batchAttendanceOpen, setBatchAttendanceOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Use our custom hooks
  const { data: handlers, isLoading: isLoadingHandlers, refetch, error } = useClassHandlers(classId);
  const { data: scheduleDates, isLoading: isLoadingDates } = useScheduleDates(classId);
  const { editingBookingId, formData, handleInputChange, startEditing, saveChanges, removeHandler } = useHandlerForm();
  
  // Use the enhanced hooks
  const { 
    openRemoveDialog, 
    setOpenRemoveDialog, 
    bookingToRemove,
    setBookingToRemove,
    isRemoving,
    setIsRemoving,
    handleRemove 
  } = useRemoveHandler();
  
  const {
    attendanceModalOpen,
    setAttendanceModalOpen,
    selectedBooking,
    selectedDate,
    isUpdating,
    handleOpenAttendanceModal,
    handleAttendanceUpdated
  } = useAttendanceModal(classId);

  // Track if we've attempted the initial load
  useEffect(() => {
    if (!initialLoadAttempted) {
      refetch().finally(() => setInitialLoadAttempted(true));
      setInitialLoadAttempted(true);
    }
  }, [refetch, initialLoadAttempted]);

  // Ensure the component refetches when it mounts
  useEffect(() => {
    // Immediate refetch on mount
    refetch();
    
    // Set up a periodic refresh
    const refreshInterval = setInterval(() => {
      refetch().catch(err => {
        console.error("Error refreshing class handlers:", err);
      });
    }, 10000); // Refresh every 10 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [refetch]);

  const confirmRemove = async () => {
    if (bookingToRemove) {
      setIsRemoving(true);
      try {
        await removeHandler(bookingToRemove, classId);
      } catch (error) {
        console.error("Error removing handler:", error);
      } finally {
        setIsRemoving(false);
        setBookingToRemove(null);
        setOpenRemoveDialog(false);
      }
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

  // Handle batch attendance updated
  const handleBatchAttendanceUpdated = () => {
    refetch();
    setBatchAttendanceOpen(false);
  };

  // If there's an error loading, show error state
  if (error) {
    return (
      <div className="text-center p-6">
        <div className="text-red-600 mb-4">
          Error loading class handlers: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => refetch()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isLoadingHandlers || isLoadingDates) {
    return (
      <div className="text-center p-6">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-mckaynine-600" />
        <p>Loading class handlers...</p>
      </div>
    );
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
      <div className="mb-4 flex justify-end">
        <Button 
          onClick={() => setBatchAttendanceOpen(true)}
          className="flex items-center gap-2"
          variant="outline"
        >
          <CalendarRange className="h-4 w-4" />
          <span className="hidden sm:inline">Batch Attendance</span>
          <span className="sm:hidden">Attendance</span>
        </Button>
      </div>
      
      <div className={`overflow-x-auto ${isMobile ? "hidden sm:block" : ""}`}>
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

      {/* Mobile view simplified list */}
      <div className="sm:hidden">
        <div className="text-sm font-medium text-center mb-3 text-gray-500">
          Use the Batch Attendance button above for easier mobile attendance tracking
        </div>
        {handlers.map(booking => {
          const handler = booking.clients;
          const dog = booking.dogs;
          
          return (
            <div key={booking.id} className="border rounded-md p-3 mb-2">
              <div className="font-medium">{handler?.first_name} {handler?.last_name}</div>
              <div className="text-sm text-gray-500">{dog?.name} ({dog?.breed})</div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs">
                  {booking.computed_payment_status === 'paid' ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">Paid</span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">Unpaid</span>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => startEditing(booking)}
                >
                  Edit
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Remove Handler Dialog */}
      <RemoveHandlerDialog
        open={openRemoveDialog}
        onOpenChange={setOpenRemoveDialog}
        onConfirm={confirmRemove}
        isLoading={isRemoving}
      />

      {/* Individual Attendance Modal */}
      {selectedBooking && selectedDate && (
        <AttendanceModal
          open={attendanceModalOpen}
          onOpenChange={setAttendanceModalOpen}
          booking={selectedBooking}
          classDate={selectedDate}
          classId={classId}
          onAttendanceUpdated={handleAttendanceUpdated}
          isUpdating={isUpdating}
        />
      )}
      
      {/* Batch Attendance Modal */}
      <BatchAttendanceModal
        open={batchAttendanceOpen}
        onOpenChange={setBatchAttendanceOpen}
        bookings={handlers}
        scheduleDates={sortedDates}
        classId={classId}
        onAttendanceUpdated={handleBatchAttendanceUpdated}
      />
    </>
  );
}
