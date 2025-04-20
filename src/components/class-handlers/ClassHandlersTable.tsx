
import { useClassHandlers } from "./hooks/useClassHandlers";
import { useScheduleDates } from "./hooks/useScheduleDates";
import { useHandlerForm } from "./hooks/useHandlerForm";
import { useState, useEffect } from "react";
import { useAttendanceModal } from "./hooks/useAttendanceModal";
import { useRemoveHandler } from "./hooks/useRemoveHandler";
import { useIsMobile } from "@/hooks/useIsMobile";
import { RemoveHandlerDialog } from "./RemoveHandlerDialog";
import { AttendanceModal } from "./attendance/AttendanceModal";
import { AttendanceStatusCell } from "./attendance/AttendanceStatusCell";
import { BatchAttendanceModal } from "./attendance/BatchAttendanceModal";
import { TableActions } from "./table-actions/TableActions";
import { HandlersTableContainer } from "./table/HandlersTableContainer";
import { MobileHandlersList } from "./mobile/MobileHandlersList";
import { Loader2 } from "lucide-react";

interface ClassHandlersTableProps {
  classId: string;
}

export function ClassHandlersTable({ classId }: ClassHandlersTableProps) {
  const [initialLoadAttempted, setInitialLoadAttempted] = useState<boolean>(false);
  const [batchAttendanceOpen, setBatchAttendanceOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const { data: handlers, isLoading: isLoadingHandlers, refetch, error } = useClassHandlers(classId);
  const { data: scheduleDates, isLoading: isLoadingDates } = useScheduleDates(classId);
  const { editingBookingId, formData, handleInputChange, startEditing, saveChanges, removeHandler } = useHandlerForm();
  
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

  useEffect(() => {
    if (!initialLoadAttempted) {
      refetch().finally(() => setInitialLoadAttempted(true));
      setInitialLoadAttempted(true);
    }
  }, [refetch, initialLoadAttempted]);

  useEffect(() => {
    refetch();
    const refreshInterval = setInterval(() => {
      refetch().catch(console.error);
    }, 10000);
    return () => clearInterval(refreshInterval);
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

  const renderAttendanceStatus = (booking: any, date: string) => (
    <AttendanceStatusCell
      booking={booking}
      date={date}
      onOpenAttendanceModal={handleOpenAttendanceModal}
    />
  );

  const handleBatchAttendanceUpdated = () => {
    refetch();
    setBatchAttendanceOpen(false);
  };

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

  const sortedDates = scheduleDates ? [...scheduleDates].sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  ) : [];

  return (
    <>
      <TableActions 
        onBatchAttendanceOpen={() => setBatchAttendanceOpen(true)}
        isMobile={isMobile}
      />
      
      <HandlersTableContainer 
        handlers={handlers}
        editingBookingId={editingBookingId}
        formData={formData}
        handleInputChange={handleInputChange}
        startEditing={startEditing}
        saveChanges={saveChanges}
        handleRemove={handleRemove}
        scheduleDates={sortedDates}
        renderAttendanceStatus={renderAttendanceStatus}
      />

      <MobileHandlersList 
        handlers={handlers}
        startEditing={startEditing}
      />

      <RemoveHandlerDialog
        open={openRemoveDialog}
        onOpenChange={setOpenRemoveDialog}
        onConfirm={confirmRemove}
        isLoading={isRemoving}
      />

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
