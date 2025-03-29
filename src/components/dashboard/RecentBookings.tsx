
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function RecentBookings() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['recent-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          payment_status,
          created_at,
          clients(first_name, last_name),
          dogs(name),
          class_schedules(
            start_time,
            classes(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentStatusVariant = (status: string) => {
    switch(status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'refunded': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">Loading bookings...</div>
        ) : bookings && bookings.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Dog</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.clients?.first_name} {booking.clients?.last_name}</TableCell>
                  <TableCell>{booking.dogs?.name}</TableCell>
                  <TableCell>
                    {booking.class_schedules?.classes?.name}
                    <div className="text-xs text-gray-500">
                      {new Date(booking.class_schedules?.start_time).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${getStatusColor(booking.status)}`}></div>
                      <span className="capitalize">{booking.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentStatusVariant(booking.payment_status)}>
                      {booking.payment_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-4 text-gray-500">No recent bookings found</div>
        )}
      </CardContent>
    </Card>
  );
}
