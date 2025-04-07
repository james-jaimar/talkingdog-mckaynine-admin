
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookingToInvoiceProvider } from "./booking-components/BookingToInvoiceProvider";
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
          {({ 
            selectedBookings, 
            status, 
            setStatus, 
            isProcessing, 
            bookingsLoading, 
            unpaidBookings, 
            enrolledBookings, 
            toggleSelectAll, 
            toggleBooking, 
            calculateTotal, 
            handleCreateInvoice 
          }) => (
            <div className="space-y-4">
              {/* Summary of enrolled classes */}
              <EnrolledClassesSummary enrolledBookings={enrolledBookings} />

              {/* Booking list with selection and status filter */}
              <BookingList
                bookingsLoading={bookingsLoading}
                unpaidBookings={unpaidBookings}
                selectedBookings={selectedBookings}
                toggleSelectAll={toggleSelectAll}
                toggleBooking={toggleBooking}
                status={status}
                setStatus={setStatus}
                selectedCount={selectedBookings.length}
                totalCount={unpaidBookings.length}
                totalAmount={calculateTotal()}
              />

              <BookingToInvoiceFooter 
                isProcessing={isProcessing}
                selectedCount={selectedBookings.length}
                onCancel={() => onOpenChange(false)}
                onCreateInvoice={handleCreateInvoice}
              />
            </div>
          )}
        </BookingToInvoiceProvider>
      </DialogContent>
    </Dialog>
  );
}
