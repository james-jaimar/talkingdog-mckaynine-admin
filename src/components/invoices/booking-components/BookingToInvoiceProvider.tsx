
import { useState, ReactNode } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { InvoiceFormValues } from "@/types/invoice";
import { toast } from "sonner";
import { useBookings } from "./useBookings";
import { calculateInvoiceTotals } from "@/lib/invoiceMath";

interface BookingToInvoiceProviderProps {
  children: (props: BookingToInvoiceContextProps) => ReactNode;
  clientId: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export interface BookingToInvoiceContextProps {
  selectedBookings: string[];
  status: "draft" | "sent";
  setStatus: (status: "draft" | "sent") => void;
  isProcessing: boolean;
  bookingsLoading: boolean;
  unpaidBookings: any[];
  enrolledBookings: any[];
  toggleSelectAll: () => void;
  toggleBooking: (id: string) => void;
  calculateTotal: () => number;
  handleCreateInvoice: () => Promise<void>;
}

export function BookingToInvoiceProvider({ 
  children, 
  clientId, 
  onOpenChange, 
  onSuccess 
}: BookingToInvoiceProviderProps) {
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
  } = useBookings(clientId, true);

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
      
      // Log selected booking data for debugging
      console.log("Creating invoice with selected bookings:", selectedBookingData);
      
      if (selectedBookingData.length === 0) {
        throw new Error("Failed to find selected bookings data");
      }
      
      // Validate booking data
      const validBookings = selectedBookingData.filter(booking => {
        const price = booking.class_schedules?.classes?.price || 0;
        const className = booking.class_schedules?.classes?.name || '';
        const dogName = booking.dogs?.name || '';
        
        if (!className) {
          console.warn(`Booking ${booking.id} has no class name`);
        }
        
        if (!dogName) {
          console.warn(`Booking ${booking.id} has no dog name`);
        }
        
        return price > 0 && className && dogName;
      });
      
      if (validBookings.length === 0) {
        throw new Error("No valid bookings found with complete information");
      }
      
      const items = validBookings.map(booking => {
        const className = booking.class_schedules?.classes?.name || 'Training Class';
        const price = booking.class_schedules?.classes?.price || 0;
        const dogName = booking.dogs?.name || 'Unknown Dog';
        
        console.log(`Creating invoice item for booking ${booking.id}: ${className} at price ${price} for dog ${dogName}`);
        
        return {
          description: `${className} - ${dogName}`,
          quantity: 1,
          unit_price: price,
          booking_id: booking.id, // Ensure booking_id is explicitly set
        };
      });
      
      // Calculate totals using our utility
      const invoiceTotals = calculateInvoiceTotals({
        items,
        discountType: 'fixed',
        discountAmount: 0,
        taxRate: 0
      });
      
      // Prepare invoice data
      const invoice: InvoiceFormValues = {
        client_id: clientId,
        invoice_number: invoiceNumber,
        status: status,
        issued_date: new Date(),
        due_date: new Date(), // Due date defaults to today (same as issued date)
        notes: `Invoice for training classes. Includes ${items.length} booking(s).`,
        tax_rate: 0,
        items,
        discount_amount: 0,
        discount_type: 'fixed',
        discount_reason: ''
      };
      
      // Log complete invoice data before submission
      console.log("Submitting invoice data:", invoice);
      
      // Create the invoice
      await createInvoice.mutateAsync(invoice);
      
      toast.success(`Invoice created successfully`);
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error creating invoice from bookings:", error);
      
      // Provide more detailed error message
      if (error instanceof Error) {
        toast.error(`Failed to create invoice: ${error.message}`);
      } else {
        toast.error("Failed to create invoice");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const providerValue: BookingToInvoiceContextProps = {
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
  };

  return (
    <>
      {children(providerValue)}
    </>
  );
}
