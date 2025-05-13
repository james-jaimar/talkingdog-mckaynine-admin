import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, LinkIcon, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useProblematicInvoices } from "@/hooks/invoices/useProblematicInvoices";
import { useInvoices } from "@/hooks/useInvoices";
import { useBookingsData } from "@/hooks/useBookingsData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function ProblematicInvoicesManager() {
  const { data, isLoading, linkInvoiceItemToBooking } = useProblematicInvoices();
  const { useInvoiceDetails } = useInvoices();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  
  // Get details of the selected invoice
  const { data: selectedInvoice, isLoading: isLoadingInvoiceDetails } = useInvoiceDetails(
    selectedInvoiceId || ""
  );
  
  // Get the client's bookings for linking
  const clientId = selectedInvoice?.client?.id;
  const { bookings, isLoading: isLoadingBookings } = useBookingsData(
    clientId || "", 
    { enabled: !!clientId }
  );
  
  const problematicInvoices = data?.invoices || [];
  const itemsByInvoice = data?.itemsByInvoice || {};
  
  const handleFixItem = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setOpenDialog(true);
  };
  
  const handleLinkBooking = async () => {
    if (!selectedItemId || !selectedBookingId) {
      toast.error("Please select an item and booking");
      return;
    }
    
    try {
      await linkInvoiceItemToBooking.mutateAsync({
        invoiceItemId: selectedItemId,
        bookingId: selectedBookingId
      });
      
      setOpenDialog(false);
      setSelectedItemId(null);
      setSelectedBookingId(null);
    } catch (error) {
      console.error("Error linking booking:", error);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary">Sent</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Paid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-200 text-gray-700">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
          Problematic Invoices
        </CardTitle>
        <CardDescription>
          Invoices with items that lack booking associations and appear as "General Training Services"
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : problematicInvoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="font-medium">No problematic invoices found</p>
            <p className="text-sm">All invoice items are properly associated with bookings</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {problematicInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>
                    {invoice.clients?.first_name} {invoice.clients?.last_name}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    {invoice.created_at && format(new Date(invoice.created_at), "PP")}
                  </TableCell>
                  <TableCell>ZAR {invoice.total?.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFixItem(invoice.id)}
                      className="flex items-center space-x-1"
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      Fix
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {/* Dialog for fixing problematic invoice items */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Fix Invoice Items</DialogTitle>
              <DialogDescription>
                Link invoice items without bookings to the appropriate bookings
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingInvoiceDetails ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Tabs defaultValue="unlinked" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="unlinked">Unlinked Items</TabsTrigger>
                  <TabsTrigger value="bookings">Available Bookings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="unlinked" className="space-y-4">
                  <div className="text-sm font-medium">
                    Select an item to link:
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Select</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoiceId && itemsByInvoice[selectedInvoiceId]?.filter(item => !item.booking_id).map((item) => (
                          <TableRow key={item.id} className={selectedItemId === item.id ? "bg-muted" : ""}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>ZAR {item.amount?.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant={selectedItemId === item.id ? "default" : "outline"}
                                onClick={() => setSelectedItemId(item.id)}
                              >
                                Select
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!selectedInvoiceId || !itemsByInvoice[selectedInvoiceId]?.some(item => !item.booking_id)) && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                              No unlinked items found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="bookings">
                  <div className="text-sm font-medium mb-4">
                    Select a booking to link with the selected item:
                  </div>
                  
                  {isLoadingBookings ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !bookings || bookings.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No bookings found for this client
                    </div>
                  ) : (
                    <Select value={selectedBookingId || ""} onValueChange={setSelectedBookingId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a booking" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookings.map((booking) => (
                          <SelectItem key={booking.id} value={booking.id}>
                            {booking.dogs?.name} - {booking.class_schedules?.classes?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TabsContent>
              </Tabs>
            )}
            
            <DialogFooter className="mt-4">
              <Button variant="secondary" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleLinkBooking} 
                disabled={!selectedItemId || !selectedBookingId || linkInvoiceItemToBooking.isPending}
              >
                {linkInvoiceItemToBooking.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Linking...
                  </>
                ) : (
                  'Link Booking'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
