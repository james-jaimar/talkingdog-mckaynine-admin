
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookingToInvoiceProvider, BookingToInvoiceContextProps } from "./booking-components/BookingToInvoiceProvider";
import { EnrolledClassesSummary } from "./booking-components/EnrolledClassesSummary";
import { BookingList } from "./booking-components/BookingList";
import { BookingToInvoiceFooter } from "./booking-components/BookingToInvoiceFooter";

interface BookingToInvoiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess?: () => void;
}

export function BookingToInvoice({ open, onOpenChange, clientId, onSuccess }: BookingToInvoiceProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Invoice from Bookings</DialogTitle>
        </DialogHeader>

        <BookingToInvoiceProvider 
          clientId={clientId} 
          onOpenChange={onOpenChange} 
          onSuccess={onSuccess}
        >
          {(props: BookingToInvoiceContextProps) => (
            <div className="space-y-4">
              {/* Summary of enrolled classes */}
              <EnrolledClassesSummary enrolledBookings={props.enrolledBookings} />

              {/* Booking list with selection and status filter */}
              <BookingList
                bookingsLoading={props.bookingsLoading}
                unpaidBookings={props.unpaidBookings}
                selectedBookings={props.selectedBookings}
                toggleSelectAll={props.toggleSelectAll}
                toggleBooking={props.toggleBooking}
                status={props.status}
                setStatus={props.setStatus}
                selectedCount={props.selectedBookings.length}
                totalCount={props.unpaidBookings.length}
                totalAmount={props.calculateTotal()}
              />

              <BookingToInvoiceFooter 
                isProcessing={props.isProcessing}
                selectedCount={props.selectedBookings.length}
                onCancel={() => onOpenChange(false)}
                onCreateInvoice={props.handleCreateInvoice}
              />
            </div>
          )}
        </BookingToInvoiceProvider>
      </DialogContent>
    </Dialog>
  );
}
