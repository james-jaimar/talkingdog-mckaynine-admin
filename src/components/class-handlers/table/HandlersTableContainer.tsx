
import { Table, TableBody } from "@/components/ui/table";
import { ClassHandlersTableHeader } from "./ClassHandlersTableHeader";
import { BookingRow } from "../BookingRow";
import { Booking } from "../types/booking";

interface HandlersTableContainerProps {
  handlers: Booking[];
  editingBookingId: string | null;
  formData: Record<string, any>;
  handleInputChange: (bookingId: string, field: string, value: any) => void;
  startEditing: (booking: Booking) => void;
  saveChanges: (bookingId: string, clientId?: string) => void;
  handleRemove: (bookingId: string) => void;
  scheduleDates: string[];
  renderAttendanceStatus?: (booking: any, date: string) => React.ReactNode;
}

export function HandlersTableContainer({ 
  handlers,
  editingBookingId,
  formData,
  handleInputChange,
  startEditing,
  saveChanges,
  handleRemove,
  scheduleDates,
  renderAttendanceStatus
}: HandlersTableContainerProps) {
  return (
    <div className="overflow-x-auto hidden sm:block">
      <Table>
        <ClassHandlersTableHeader scheduleDates={scheduleDates} />
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
                saveChanges={saveChanges}
                removeHandler={handleRemove}
                scheduleDates={scheduleDates}
                renderAttendanceStatus={renderAttendanceStatus}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
