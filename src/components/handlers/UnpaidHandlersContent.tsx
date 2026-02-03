
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function UnpaidHandlersContent() {
  // Fetch bookings with missing proof of payment that don't have paid invoices
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['unpaid-bookings'],
    queryFn: async () => {
      console.log("Fetching unpaid bookings with optimized query");
      
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            proof_of_payment,
            class_schedule_id,
            dogs:dog_id(id, name, breed),
            clients:client_id(id, first_name, last_name, email, phone),
            class_schedules(
              id,
              start_time,
              classes(id, name)
            ),
            invoice_items(
              invoice_id,
              invoices:invoice_id(
                id,
                payment_received
              )
            )
          `)
          .or('proof_of_payment.is.null,proof_of_payment.eq.')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching unpaid bookings:", error);
          throw error;
        }
        
        // Filter bookings that have no invoice or no paid invoice
        const unpaidBookings = data.filter(booking => {
          if (!booking.invoice_items || booking.invoice_items.length === 0) {
            return true;
          }
          
          return booking.invoice_items.every(item => 
            !item.invoices || !item.invoices.payment_received
          );
        });
        
        console.log(`Found ${unpaidBookings.length} truly unpaid bookings out of ${data.length} bookings without proof of payment`);
        return unpaidBookings;
      } catch (error) {
        console.error("Error in unpaid bookings query:", error);
        toast.error("Failed to load unpaid bookings");
        return [];
      }
    }
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Handlers Missing Proof of Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center p-6">
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-24 w-full mx-auto" />
          </div>
        ) : !bookings ? (
          <div className="text-center p-6">Checking payment status...</div>
        ) : bookings.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Handler</TableHead>
                <TableHead>Dog</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Class Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking: any) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {booking.clients?.first_name} {booking.clients?.last_name}
                  </TableCell>
                  <TableCell>{booking.dogs?.name} ({booking.dogs?.breed})</TableCell>
                  <TableCell>
                    <div>{booking.clients?.email}</div>
                    <div className="text-sm text-gray-500">{booking.clients?.phone || 'No phone'}</div>
                  </TableCell>
                  <TableCell>{booking.class_schedules?.classes?.name || 'Unknown class'}</TableCell>
                  <TableCell>
                    {booking.class_schedules?.start_time ? 
                      new Date(booking.class_schedules.start_time).toLocaleDateString() : 
                      'Not scheduled'}
                  </TableCell>
                  <TableCell className="text-right">
                    {booking.class_schedules?.classes?.id && (
                      <Link to={`/class/${booking.class_schedules.classes.id}/handlers`}>
                        <Button variant="ghost" size="sm" className="h-8">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          View Class
                        </Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center p-6 text-gray-500">
            No unpaid handlers found. All payments have been received!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
