
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookingRow } from "./BookingRow";
import { useClassHandlers } from "./hooks/useClassHandlers";
import { useScheduleDates } from "./hooks/useScheduleDates";
import { useHandlerForm } from "./hooks/useHandlerForm";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Handler / Dog</TableHead>
              <TableHead className="text-center">Enrol</TableHead>
              <TableHead className="text-center">Vacc</TableHead>
              <TableHead>POP</TableHead>
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
    </>
  );
}
