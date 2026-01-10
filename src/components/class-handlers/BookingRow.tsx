import { TableRow, TableCell } from "@/components/ui/table";
import { Booking } from "./types/booking";
import { BookingHandlerInfo } from "./booking-row/BookingHandlerInfo";
import { CheckableCell } from "./booking-row/CheckableCell";
import { EditableCell } from "./booking-row/EditableCell";
import { PaymentStatusBadge } from "./booking-row/PaymentStatusBadge";
import { BookingActionButtons } from "./booking-row/BookingActionButtons";
import { useInvoiceStatus } from "./booking-row/useInvoiceStatus";
import { ConsentStatusBadge } from "@/components/handlers/status/ConsentStatusBadge";
import { Check, Minus } from "lucide-react";
import { useHandlerCompletion } from "./hooks/useHandlerCompletion";

interface BookingRowProps {
  booking: Booking;
  isEditing: boolean;
  bookingData: any;
  handleInputChange: (bookingId: string, field: string, value: any) => void;
  startEditing: (booking: Booking) => void;
  saveChanges: (bookingId: string, clientId?: string) => void;
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

  // Fix: Use class_id if present on the booking
  const { data: completion } = useHandlerCompletion({
    handlerId: booking.client_id || "",
    classId: booking.class_id || "", // Use optional chaining/fallback
  });

  const renderInfoStatus = (hasInfo: boolean | null) => {
    if (hasInfo === true) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  return (
    <TableRow key={booking.id}>
      <TableCell className="font-medium">
        <BookingHandlerInfo booking={booking} />
        {/* Show completion status if available */}
        {(completion && completion.completed) ? (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">
            Completed {completion.completed_at ? `(${new Date(completion.completed_at).toLocaleDateString()})` : ""}
            {completion.completion_method === "auto" && (
              <span className="ml-1 italic text-xs text-green-600">(Class closed)</span>
            )}
          </span>
        ) : null}
      </TableCell>
      
      <TableCell className="text-center">
        <CheckableCell
          isEditing={isEditing}
          checked={booking.clients?.enrollment_verified ?? false}
          onChange={(checked) => handleInputChange(booking.id, 'enrollment_verified', checked)}
        />
      </TableCell>
      
      <TableCell className="text-center">
        <CheckableCell
          isEditing={isEditing}
          checked={booking.clients?.vaccination_verified ?? false}
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
      
      <TableCell className="text-center">
        <ConsentStatusBadge status={booking.clients?.uses_whatsapp_status || 'not_marked'} />
      </TableCell>
      
      <TableCell className="text-center">
        <ConsentStatusBadge status={booking.clients?.social_media_consent_status || 'not_marked'} />
      </TableCell>
      
      <TableCell className="text-center">
        {isEditing ? (
          <CheckableCell
            isEditing={true}
            checked={bookingData.info_eo || false}
            onChange={(checked) => handleInputChange(booking.id, 'info_eo', checked)}
          />
        ) : (
          renderInfoStatus(booking.info_eo_status)
        )}
      </TableCell>
      
      <TableCell className="text-center">
        {isEditing ? (
          <CheckableCell
            isEditing={true}
            checked={bookingData.info_pg || false}
            onChange={(checked) => handleInputChange(booking.id, 'info_pg', checked)}
          />
        ) : (
          renderInfoStatus(booking.info_pg_status)
        )}
      </TableCell>
      
      <TableCell>
        <BookingActionButtons 
          isEditing={isEditing}
          onSave={() => saveChanges(booking.id, booking.client_id)}
          onEdit={() => startEditing(booking)}
          onRemove={() => removeHandler(booking.id)}
        />
      </TableCell>
    </TableRow>
  );
}
