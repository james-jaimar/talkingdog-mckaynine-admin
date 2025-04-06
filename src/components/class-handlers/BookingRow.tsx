
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Save, UserMinus, Pencil, FileText } from "lucide-react";
import { Booking } from "./types/booking";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

interface BookingRowProps {
  booking: Booking;
  isEditing: boolean;
  bookingData: any;
  handleInputChange: (bookingId: string, field: string, value: any) => void;
  startEditing: (booking: Booking) => void;
  saveChanges: (bookingId: string) => void;
  removeHandler: (bookingId: string) => void;
}

export function BookingRow({
  booking,
  isEditing,
  bookingData,
  handleInputChange,
  startEditing,
  saveChanges,
  removeHandler
}: BookingRowProps) {
  // Fetch invoice status for this booking
  const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
    queryKey: ['booking-invoice', booking.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_items')
        .select(`
          invoice_id,
          invoices:invoice_id (
            id,
            status,
            payment_received,
            invoice_number
          )
        `)
        .eq('booking_id', booking.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Determine payment status display
  const paymentStatus = useMemo(() => {
    if (isLoadingInvoice) return { status: 'loading', display: 'Loading...' };
    
    if (!invoiceData) return { status: 'not-invoiced', display: 'Not Invoiced' };
    
    const invoice = invoiceData.invoices;
    
    if (invoice.payment_received) return { status: 'paid', display: 'Paid', badge: 'success' };
    
    if (invoice.status === 'cancelled') return { status: 'cancelled', display: 'Cancelled', badge: 'destructive' };
    
    if (invoice.status === 'sent') return { status: 'invoiced', display: 'Invoice Sent', badge: 'warning' };
    
    return { status: 'pending', display: 'Pending Payment', badge: 'secondary' };
  }, [invoiceData, isLoadingInvoice]);

  // Get badge variant based on payment status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'cancelled': return 'destructive';
      case 'invoiced': return 'warning';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <TableRow key={booking.id}>
      <TableCell className="font-medium">
        <div>
          <span className="font-semibold">
            {booking.clients?.first_name} {booking.clients?.last_name}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {booking.dogs?.name} ({booking.dogs?.breed})
        </div>
      </TableCell>
      
      <TableCell className="text-center">
        {isEditing ? (
          <Checkbox 
            checked={bookingData.is_enrolled} 
            onCheckedChange={(checked) => 
              handleInputChange(booking.id, 'is_enrolled', checked)
            }
          />
        ) : (
          booking.is_enrolled ? <Check className="mx-auto h-4 w-4 text-green-600" /> : null
        )}
      </TableCell>
      
      <TableCell className="text-center">
        {isEditing ? (
          <Checkbox 
            checked={bookingData.vaccination_verified} 
            onCheckedChange={(checked) => 
              handleInputChange(booking.id, 'vaccination_verified', checked)
            }
          />
        ) : (
          booking.vaccination_verified ? <Check className="mx-auto h-4 w-4 text-green-600" /> : null
        )}
      </TableCell>
      
      <TableCell>
        {isLoadingInvoice ? (
          <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
        ) : (
          <div className="flex items-center">
            {invoiceData && (
              <FileText className="h-4 w-4 mr-1.5 text-gray-500" />
            )}
            <Badge variant={getBadgeVariant(paymentStatus.status)} className="font-normal">
              {paymentStatus.display}
            </Badge>
          </div>
        )}
      </TableCell>
      
      <TableCell>
        {isEditing ? (
          <Input 
            value={bookingData.additional_notes || ''} 
            onChange={(e) => handleInputChange(booking.id, 'additional_notes', e.target.value)}
            className="h-8 text-sm"
          />
        ) : (
          booking.additional_notes || '-'
        )}
      </TableCell>
      
      <TableCell>
        {isEditing ? (
          <Input 
            value={bookingData.info_eo || ''} 
            onChange={(e) => handleInputChange(booking.id, 'info_eo', e.target.value)}
            className="h-8 text-sm"
          />
        ) : (
          booking.info_eo || '-'
        )}
      </TableCell>
      
      <TableCell className="text-center">
        {isEditing ? (
          <Checkbox 
            checked={bookingData.uses_whatsapp} 
            onCheckedChange={(checked) => 
              handleInputChange(booking.id, 'uses_whatsapp', checked)
            }
          />
        ) : (
          booking.uses_whatsapp ? <Check className="mx-auto h-4 w-4 text-green-600" /> : null
        )}
      </TableCell>
      
      <TableCell className="text-center">
        {isEditing ? (
          <Checkbox 
            checked={bookingData.social_media_consent} 
            onCheckedChange={(checked) => 
              handleInputChange(booking.id, 'social_media_consent', checked)
            }
          />
        ) : (
          booking.social_media_consent ? <Check className="mx-auto h-4 w-4 text-green-600" /> : null
        )}
      </TableCell>
      
      <TableCell>
        {isEditing ? (
          <Input 
            value={bookingData.info_pg || ''} 
            onChange={(e) => handleInputChange(booking.id, 'info_pg', e.target.value)}
            className="h-8 text-sm"
          />
        ) : (
          booking.info_pg || '-'
        )}
      </TableCell>
      
      <TableCell>
        <div className="flex space-x-2">
          {isEditing ? (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => saveChanges(booking.id)}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startEditing(booking)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-red-50"
            onClick={() => removeHandler(booking.id)}
          >
            <UserMinus className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
