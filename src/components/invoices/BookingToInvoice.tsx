
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceFormValues } from "@/types/invoice";
import { Booking } from "@/components/class-handlers/types/booking";

interface BookingToInvoiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess?: () => void;
}

interface BookingWithClass extends Booking {
  classes?: {
    name: string;
    price: number;
  };
}

export function BookingToInvoice({ open, onOpenChange, clientId, onSuccess }: BookingToInvoiceProps) {
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "sent">("draft");
  const [isProcessing, setIsProcessing] = useState(false);
  const { createInvoice, generateInvoiceNumber } = useInvoices();
  
  // Fetch unpaid bookings for this client
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['unpaid-bookings', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          dogs:dog_id (id, name),
          class_schedules:class_schedule_id (
            start_time,
            classes:class_id (id, name, price)
          )
        `)
        .eq('client_id', clientId)
        .is('proof_of_payment', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BookingWithClass[];
    },
    enabled: !!clientId && open,
  });

  // Select/deselect all bookings
  const toggleSelectAll = () => {
    if (selectedBookings.length === bookings?.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(bookings?.map(b => b.id) || []);
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
      const selectedBookingData = bookings?.filter(b => selectedBookings.includes(b.id)) || [];
      const items = selectedBookingData.map(booking => {
        const className = booking.class_schedules?.classes?.name || 'Class';
        const price = booking.class_schedules?.classes?.price || 0;
        const dogName = booking.dogs?.name || 'Unknown Dog';
        
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
        tax_rate: 15, // Default tax rate
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
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Select Bookings to Include</h3>
            <Select value={status} onValueChange={(value: "draft" | "sent") => setStatus(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Mark as Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={bookings?.length ? selectedBookings.length === bookings.length : false}
                      onCheckedChange={toggleSelectAll}
                      disabled={bookingsLoading || !bookings?.length}
                    />
                  </TableHead>
                  <TableHead>Dog</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : bookings?.length ? (
                  bookings.map(booking => (
                    <TableRow key={booking.id}>
                      <TableCell className="p-2">
                        <Checkbox 
                          checked={selectedBookings.includes(booking.id)}
                          onCheckedChange={() => toggleBooking(booking.id)}
                        />
                      </TableCell>
                      <TableCell>{booking.dogs?.name || 'N/A'}</TableCell>
                      <TableCell>{booking.class_schedules?.classes?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {booking.class_schedules?.start_time
                          ? format(new Date(booking.class_schedules.start_time), 'PP')
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        ZAR {booking.class_schedules?.classes?.price?.toFixed(2) || '0.00'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No unpaid bookings found for this client.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-sm">
              Selected: <span className="font-medium">{selectedBookings.length}</span> of <span className="font-medium">{bookings?.length || 0}</span>
            </div>
            <div className="text-sm font-medium">
              Total: ZAR {bookings
                ?.filter(b => selectedBookings.includes(b.id))
                .reduce((sum, b) => sum + (b.class_schedules?.classes?.price || 0), 0)
                .toFixed(2) || '0.00'
              }
            </div>
          </div>
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
