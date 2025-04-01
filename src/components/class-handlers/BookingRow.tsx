
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Save } from "lucide-react";
import { Booking } from "./types/booking";

interface BookingRowProps {
  booking: Booking;
  isEditing: boolean;
  bookingData: any;
  handleInputChange: (bookingId: string, field: string, value: any) => void;
  startEditing: (booking: Booking) => void;
  saveChanges: (bookingId: string) => void;
}

export function BookingRow({
  booking,
  isEditing,
  bookingData,
  handleInputChange,
  startEditing,
  saveChanges
}: BookingRowProps) {
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
        {isEditing ? (
          <Input 
            value={bookingData.proof_of_payment || ''} 
            onChange={(e) => handleInputChange(booking.id, 'proof_of_payment', e.target.value)}
            className="h-8 text-sm"
          />
        ) : (
          booking.proof_of_payment || '-'
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
            Edit
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
