
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { BookingWithClass } from "./useBookings";

interface BookingListProps {
  bookingsLoading: boolean;
  unpaidBookings: BookingWithClass[];
  selectedBookings: string[];
  toggleSelectAll: () => void;
  toggleBooking: (id: string) => void;
  status: "draft" | "sent";
  setStatus: (status: "draft" | "sent") => void;
  selectedCount: number;
  totalCount: number;
  totalAmount: number;
}

export function BookingList({ 
  bookingsLoading, 
  unpaidBookings, 
  selectedBookings, 
  toggleSelectAll, 
  toggleBooking,
  status,
  setStatus,
  selectedCount,
  totalCount,
  totalAmount
}: BookingListProps) {
  return (
    <>
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
                    {booking.class_schedules?.classes?.price 
                      ? formatCurrency(booking.class_schedules.classes.price) 
                      : 'N/A'}
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
          Selected: <span className="font-medium">{selectedCount}</span> of <span className="font-medium">{totalCount}</span>
        </div>
        <div className="text-sm font-medium">
          Total: {formatCurrency(totalAmount)}
        </div>
      </div>
    </>
  );
}
