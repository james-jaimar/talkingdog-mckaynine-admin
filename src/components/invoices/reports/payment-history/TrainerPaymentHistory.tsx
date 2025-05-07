
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { TrainerPaymentHistoryRow } from "./TrainerPaymentHistoryRow";
import { PaymentDetailsDialog } from "./PaymentDetailsDialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { useNavigate } from "react-router-dom";

interface TrainerPaymentHistoryProps {
  limit?: number;
  showViewAll?: boolean;
}

export function TrainerPaymentHistory({ limit = 10, showViewAll = false }: TrainerPaymentHistoryProps) {
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['trainer-payment-history'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('trainer_payments')
          .select(`
            id,
            trainer_id,
            payment_date,
            payment_method,
            amount,
            status,
            transaction_id,
            document_url,
            document_name,
            notes,
            trainers:trainer_id (
              id,
              first_name,
              last_name
            )
          `)
          .eq('status', 'paid')
          .order('payment_date', { ascending: false })
          .limit(limit * totalPages);

        if (error) throw error;

        // Format the trainer name from the joined table
        const formattedPayments = data.map(payment => ({
          ...payment,
          trainer_name: payment.trainers 
            ? `${payment.trainers.first_name} ${payment.trainers.last_name}` 
            : 'Unknown'
        }));
        
        console.log("Trainer payment history data:", formattedPayments);
        return formattedPayments;

      } catch (error) {
        console.error("Error fetching trainer payment history:", error);
        throw error;
      }
    },
  });

  const handleViewDetails = (paymentId: string) => {
    const payment = payments?.find(p => p.id === paymentId);
    if (payment) {
      setSelectedPayment(payment);
      setDetailsOpen(true);
    }
  };

  const handleRefresh = () => {
    refetch();
  };
  
  const handleViewAll = () => {
    navigate("/financial-reports?tab=trainers");
  };
  
  // Calculate total pages based on limit and total payments
  const totalPages = payments ? Math.max(1, Math.ceil(payments.length / limit)) : 1;
  
  // Get current page's data
  const paginatedPayments = payments ? 
    payments.slice((currentPage - 1) * limit, currentPage * limit) : 
    [];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Trainer Payments</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8 gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          {showViewAll && (
            <Button variant="outline" size="sm" className="h-8" onClick={handleViewAll}>
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trainer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Document</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24">
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            ) : !payments || payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No recent payments found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedPayments.map((payment, index) => (
                <TrainerPaymentHistoryRow 
                  key={payment.id} 
                  payment={payment} 
                  index={index}
                  onViewDetails={handleViewDetails}
                />
              ))
            )}
          </TableBody>
        </Table>
        
        {payments && payments.length > limit && (
          <div className="mt-4 flex justify-center">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        <PaymentDetailsDialog 
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          payment={selectedPayment}
        />
      </CardContent>
    </Card>
  );
}
