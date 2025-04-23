import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTermSelection } from '@/hooks/useTermSelection';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

interface RecentBookingsProps {
  branchId?: string;
}

export function RecentBookings({ branchId }: RecentBookingsProps) {
  const { termData, termDateRange } = useTermSelection();

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['recent-bookings', branchId, termData?.id],
    queryFn: async () => {
      // Don't fetch data if no branch is selected
      if (!branchId) return [];
      
      console.log('Fetching recent bookings with term date range:', termDateRange);
      
      // Build the query with branch filter
      let query = supabase
        .from('bookings')
        .select(`
          id,
          status,
          payment_status,
          created_at,
          clients!inner(first_name, last_name, branch_id),
          dogs(name),
          class_schedules(
            start_time,
            term_id,
            classes(name)
          )
        `)
        .eq('clients.branch_id', branchId);
      
      // Filter by term if selected
      if (termData?.id) {
        query = query.eq('class_schedules.term_id', termData.id);
      }
      // Otherwise use date filters if term range is available
      else if (termDateRange?.startDate) {
        query = query.gte('created_at', termDateRange.startDate);
        
        if (termDateRange?.endDate) {
          query = query.lte('created_at', termDateRange.endDate);
        }
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      console.log('Recent bookings fetched:', data?.length || 0);
      return data;
    },
    enabled: !!branchId,
    staleTime: 30000 // 30 seconds cache time
  });

  // Refetch when term changes
  useEffect(() => {
    refetch();
  }, [termData?.id, refetch]);

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
        {!branchId ? (
          <div className="text-center py-4 text-gray-500">Please select a branch</div>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
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
          <div className="text-center py-4 text-gray-500">
            {termData ? `No recent bookings found for Term ${termData.term_number}` : 'No recent bookings found'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
