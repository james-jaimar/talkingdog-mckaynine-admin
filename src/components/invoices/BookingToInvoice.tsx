
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { InvoiceFormValues } from "@/types/invoice";
import { toast } from "sonner";
import { BookingList } from "./booking-components/BookingList";
import { EnrolledClassesSummary } from "./booking-components/EnrolledClassesSummary";
import { useBookings } from "./booking-components/useBookings";

interface BookingToInvoiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess?: () => void;
}

export function BookingToInvoice({ open, onOpenChange, clientId, onSuccess }: BookingToInvoiceProps) {
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "sent">("draft");
  const [isProcessing, setIsProcessing] = useState(false);
  const { createInvoice, generateInvoiceNumber } = useInvoices();
  
  // Use the custom hook to fetch and process bookings
  const { 
    allBookings, 
    unpaidBookings, 
    enrolledBookings, 
    isLoading: bookingsLoading 
  } = useBookings(clientId, open);

  // Select/deselect all bookings
  const toggleSelectAll = () => {
    if (selectedBookings.length === unpaidBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(unpaidBookings.map(b => b.id) || []);
    }
  };

  // Toggle a single booking selection
  const toggleBooking = (id: string) => {
    if (selectedBookings.includes(id)) {
      setSelectedBookings(selectedBookings.filter(b => b !== id));
    } else {
      setSelectedBookings([...selectedBookings, id]);
    }
  };

  // Calculate total from selected bookings
  const calculateTotal = () => {
    return allBookings
      ?.filter(b => selectedBookings.includes(b.id))
      .reduce((sum, b) => sum + (b.class_schedules?.classes?.price || 0), 0) || 0;
  };

  // Create invoice from selected bookings
  const handleCreateInvoice = async () => {
    if (!selectedBookings.length) {
      toast.error("Please select at least one booking");
      return;
    }

    setIsProcessing(true);

    try {
      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber();
      
      // Create items from selected bookings
      const selectedBookingData = allBookings?.filter(b => selectedBookings.includes(b.id)) || [];
      const items = selectedBookingData.map(booking => {
        const className = booking.class_schedules?.classes?.name || 'Class';
        const price = booking.class_schedules?.classes?.price || 0;
        const dogName = booking.dogs?.name || 'Unknown Dog';
        
        console.log(`Creating invoice item for ${className} at price ${price}`);
        
        return {
          description: `${className} for ${dogName}`,
          quantity: 1,
          unit_price: price,
          booking_id: booking.id,
        };
      });
      
      // Prepare invoice data
      const invoice: InvoiceFormValues = {
        client_id: clientId,
        invoice_number: invoiceNumber,
        status: status,
        issued_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        notes: `Invoice for training classes. Includes ${selectedBookings.length} booking(s).`,
        tax_rate: 0, // Set tax rate to 0%
        items,
      };
      
      // Create the invoice
      await createInvoice.mutateAsync(invoice);
      
      toast.success(`Invoice created successfully`);
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Invoice from Bookings</DialogTitle>
        </DialogHeader>

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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateInvoice}
            disabled={selectedBookings.length === 0 || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Invoice'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
