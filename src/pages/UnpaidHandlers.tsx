
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Booking } from "@/components/class-handlers/types/booking";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";

export default function UnpaidHandlers() {
  const navigate = useNavigate();
  
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['unpaid-bookings'],
    queryFn: async () => {
      console.log("Fetching unpaid bookings");
      
      // Updated query to fetch ALL bookings without proof of payment, regardless of class
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
          )
        `)
        .is('proof_of_payment', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching unpaid bookings:", error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} unpaid bookings`);
      return data;
    }
  });

  return (
    <DashboardLayout>
      <Helmet>
        <title>Unpaid Handlers - McKaynine Training Centre</title>
      </Helmet>
      <div className="space-y-6 w-full py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Unpaid Handlers</h1>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back to Dashboard
          </Button>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Handlers Missing Proof of Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center p-6">Loading unpaid handlers...</div>
            ) : bookings && bookings.length > 0 ? (
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
      </div>
    </DashboardLayout>
  );
}
