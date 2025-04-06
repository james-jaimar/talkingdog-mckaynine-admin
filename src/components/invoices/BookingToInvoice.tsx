
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, AlertCircle } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceFormValues } from "@/types/invoice";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface BookingToInvoiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess?: () => void;
}

// Updated interface to match the actual structure returned from the database
interface BookingWithClass {
  id: string;
  is_enrolled: boolean;
  vaccination_verified: boolean;
  proof_of_payment: string | null;
  additional_notes: string | null;
  info_eo: string | null;
  uses_whatsapp: boolean;
  social_media_consent: boolean;
  info_pg: string | null;
  class_schedule_id: string;
  dog_id: string;
  client_id: string;
  status: string;
  payment_status: string;
  notes: string | null;
  dogs?: {
    id: string;
    name: string;
    breed: string;
  };
  class_schedules?: {
    start_time: string;
    classes?: {
      id: string;
      name: string;
      price: number;
    };
  };
}

export function BookingToInvoice({ open, onOpenChange, clientId, onSuccess }: BookingToInvoiceProps) {
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "sent">("draft");
  const [isProcessing, setIsProcessing] = useState(false);
  const { createInvoice, generateInvoiceNumber } = useInvoices();
  
  // Fetch all bookings for this client, not just unpaid ones
  const { data: allBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['client-bookings', clientId, open],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          dogs:dog_id (id, name, breed),
          class_schedules:class_schedule_id (
            start_time,
            classes:class_id (id, name, price)
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as BookingWithClass[];
    },
    enabled: !!clientId && open,
  });

  // Filter to get unpaid bookings (those without proof_of_payment)
  const unpaidBookings = allBookings?.filter(b => !b.proof_of_payment) || [];
  
  // Filter to get bookings that are already in classes (paid or not)
  const enrolledBookings = allBookings?.filter(b => 
    b.class_schedules?.classes?.name && b.is_enrolled
  ) || [];

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
          {enrolledBookings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Current Class Enrollments</AlertTitle>
              <AlertDescription>
                This handler is currently enrolled in the following classes:
                <ul className="mt-2 list-disc pl-5">
                  {enrolledBookings.map((booking) => (
                    <li key={booking.id}>
                      {booking.dogs?.name}: {booking.class_schedules?.classes?.name}
                      {booking.proof_of_payment ? " (Paid)" : " (Unpaid)"}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

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
                      checked={unpaidBookings.length ? selectedBookings.length === unpaidBookings.length : false}
                      onCheckedChange={toggleSelectAll}
                      disabled={bookingsLoading || !unpaidBookings.length}
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
                ) : unpaidBookings.length ? (
                  unpaidBookings.map(booking => (
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
              Selected: <span className="font-medium">{selectedBookings.length}</span> of <span className="font-medium">{unpaidBookings.length || 0}</span>
            </div>
            <div className="text-sm font-medium">
              Total: ZAR {allBookings
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
