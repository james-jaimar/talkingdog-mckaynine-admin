import { useAuth } from "@/context/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DollarSign, TrendingUp, Clock, Loader2, Wallet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TrainerEarnings() {
  const { trainerProfile, isTrainer } = useAuth();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['trainer-earnings-full', trainerProfile?.id],
    queryFn: async () => {
      if (!trainerProfile?.id) return [];

      const { data, error } = await supabase
        .from('trainer_payments')
        .select(`
          id,
          amount,
          status,
          payment_date,
          created_at,
          notes,
          class_schedules:class_schedule_id (
            start_time,
            classes:class_id (
              name,
              class_type
            )
          )
        `)
        .eq('trainer_id', trainerProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching trainer payments:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!trainerProfile?.id,
  });

  // Calculate totals
  const totalEarned = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const now = new Date();
  const thisMonthEarnings = payments
    .filter(p => {
      const paymentDate = new Date(p.payment_date || p.created_at);
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear() &&
             p.status === 'paid';
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const lastMonthEarnings = payments
    .filter(p => {
      const paymentDate = new Date(p.payment_date || p.created_at);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return paymentDate.getMonth() === lastMonth.getMonth() && 
             paymentDate.getFullYear() === lastMonth.getFullYear() &&
             p.status === 'paid';
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isTrainer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p>Access restricted to trainers only.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>My Earnings - Trainer Portal</title>
      </Helmet>

      <div className="space-y-4 sm:space-y-6 py-4 sm:py-6 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">My Earnings</h1>
          <p className="text-sm text-muted-foreground">Track your payments and earnings</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="pb-1 sm:pb-2 flex flex-row items-center justify-between space-y-0 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Earned</CardTitle>
                  <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    R{totalEarned.toFixed(0)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1 sm:pb-2 flex flex-row items-center justify-between space-y-0 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">This Month</CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    R{thisMonthEarnings.toFixed(0)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{format(now, 'MMM yyyy')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1 sm:pb-2 flex flex-row items-center justify-between space-y-0 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Last Month</CardTitle>
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    R{lastMonthEarnings.toFixed(0)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'MMM yyyy')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1 sm:pb-2 flex flex-row items-center justify-between space-y-0 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-lg sm:text-2xl font-bold text-amber-600">
                    R{totalPending.toFixed(0)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Awaiting</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment History */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Payment History</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                {payments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No payment records yet.
                  </p>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>
                                {format(new Date(payment.payment_date || payment.created_at), 'PP')}
                              </TableCell>
                              <TableCell className="font-medium">
                                {payment.class_schedules?.classes?.name || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {payment.class_schedules?.classes?.class_type || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                R{(payment.amount || 0).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(payment.status)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile List */}
                    <div className="sm:hidden divide-y">
                      {payments.map((payment) => (
                        <div key={payment.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {payment.class_schedules?.classes?.name || 'N/A'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {payment.class_schedules?.classes?.class_type || 'N/A'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(payment.payment_date || payment.created_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm">R{(payment.amount || 0).toFixed(0)}</p>
                              <div className="mt-1">
                                {getStatusBadge(payment.status)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
