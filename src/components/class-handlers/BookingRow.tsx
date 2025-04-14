
import { TableRow, TableCell } from "@/components/ui/table";
import { Booking } from "./types/booking";
import { BookingHandlerInfo } from "./booking-row/BookingHandlerInfo";
import { CheckableCell } from "./booking-row/CheckableCell";
import { EditableCell } from "./booking-row/EditableCell";
import { PaymentStatusBadge } from "./booking-row/PaymentStatusBadge";
import { BookingActionButtons } from "./booking-row/BookingActionButtons";
import { useInvoiceStatus } from "./booking-row/useInvoiceStatus";

interface BookingRowProps {
  booking: Booking;
  isEditing: boolean;
  bookingData: any;
  handleInputChange: (bookingId: string, field: string, value: any) => void;
  startEditing: (booking: Booking) => void;
  saveChanges: (bookingId: string) => void;
  removeHandler: (bookingId: string) => void;
  scheduleDates?: string[];
  renderAttendanceStatus?: (booking: any, date: string) => React.ReactNode;
}

export function BookingRow({
  booking,
  isEditing,
  bookingData,
  handleInputChange,
  startEditing,
  saveChanges,
  removeHandler,
  scheduleDates = [],
  renderAttendanceStatus
}: BookingRowProps) {
  // Use the extracted hook for invoice status
  const { data: invoiceData, isLoading: isLoadingInvoice } = useInvoiceStatus(booking.id);

  return (
    <TableRow key={booking.id}>
      <TableCell className="font-medium">
        <BookingHandlerInfo booking={booking} />
      </TableCell>
      
      <TableCell className="text-center">
        <CheckableCell
          isEditing={isEditing}
          checked={bookingData.is_enrolled}
          onChange={(checked) => handleInputChange(booking.id, 'is_enrolled', checked)}
        />
      </TableCell>
      
      <TableCell className="text-center">
        <CheckableCell
          isEditing={isEditing}
          checked={bookingData.vaccination_verified}
          onChange={(checked) => handleInputChange(booking.id, 'vaccination_verified', checked)}
        />
      </TableCell>
      
      <TableCell>
        <PaymentStatusBadge 
          invoiceData={invoiceData} 
          isLoadingInvoice={isLoadingInvoice} 
        />
      </TableCell>

      {/* Attendance date columns */}
      {scheduleDates.map((date) => (
        <TableCell key={date} className="text-center p-1">
          {renderAttendanceStatus && renderAttendanceStatus(booking, date)}
        </TableCell>
      ))}
      
      <TableCell>
        <EditableCell
          isEditing={isEditing}
          value={bookingData.additional_notes || ''}
          onChange={(value) => handleInputChange(booking.id, 'additional_notes', value)}
        />
      </TableCell>
      
      <TableCell>
        <EditableCell
          isEditing={isEditing}
          value={bookingData.info_eo || ''}
          onChange={(value) => handleInputChange(booking.id, 'info_eo', value)}
        />
      </TableCell>
      
      <TableCell className="text-center">
        <CheckableCell
          isEditing={isEditing}
          checked={bookingData.uses_whatsapp}
          onChange={(checked) => handleInputChange(booking.id, 'uses_whatsapp', checked)}
        />
      </TableCell>
      
      <TableCell className="text-center">
        <CheckableCell
          isEditing={isEditing}
          checked={bookingData.social_media_consent}
          onChange={(checked) => handleInputChange(booking.id, 'social_media_consent', checked)}
        />
      </TableCell>
      
      <TableCell>
        <EditableCell
          isEditing={isEditing}
          value={bookingData.info_pg || ''}
          onChange={(value) => handleInputChange(booking.id, 'info_pg', value)}
        />
      </TableCell>
      
      <TableCell>
        <BookingActionButtons 
          isEditing={isEditing}
          onSave={() => saveChanges(booking.id)}
          onEdit={() => startEditing(booking)}
          onRemove={() => removeHandler(booking.id)}
        />
      </TableCell>
    </TableRow>
  );
}
