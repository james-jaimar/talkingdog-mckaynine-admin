
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/formatters";
import { ChevronRight, FileText, Loader2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/useIsMobile";
import { toast } from "sonner";

interface TrainerPayment {
  id: string;
  trainer_id: string;
  trainer_name: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  notes: string | null;
  document_url: string | null;
  document_name: string | null;
}

interface TrainerPaymentHistoryProps {
  limit?: number;
  showViewAll?: boolean;
}

export function TrainerPaymentHistory({ limit = 5, showViewAll = false }: TrainerPaymentHistoryProps) {
  const [selectedPayment, setSelectedPayment] = useState<TrainerPayment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewAll, setViewAll] = useState(!showViewAll);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  const { data: payments, isLoading, error, refetch } = useQuery({
    queryKey: ['trainer-payment-history', limit, viewAll],
    queryFn: async () => {
      try {
        // Get recent payments with trainer information
        const query = supabase
          .from('trainer_payments')
          .select(`
            id,
            trainer_id,
            payment_date,
            payment_method,
            transaction_id,
            notes,
            document_url,
            document_name,
            amount,
            trainers (
              first_name,
              last_name
            )
          `)
          .eq('status', 'paid')
          .order('payment_date', { ascending: false });
        
        if (!viewAll) {
          query.limit(limit);
        }
        
        const { data, error } = await query;
        
        if (error) {
          // Check if the error is specifically about the missing columns
          if (error.message?.includes("column 'document_url' does not exist") ||
              error.message?.includes("column 'document_name' does not exist")) {
            console.error("Document URL columns don't exist yet. Migration needed:", error.message);
            
            // Fall back to querying without the document columns
            let fallbackQuery = supabase
              .from('trainer_payments')
              .select(`
                id,
                trainer_id,
                payment_date,
                payment_method,
                transaction_id,
                notes,
                amount,
                trainers (
                  first_name,
                  last_name
                )
              `)
              .eq('status', 'paid')
              .order('payment_date', { ascending: false });
              
            if (!viewAll) {
              fallbackQuery = fallbackQuery.limit(limit);
            }
            
            const { data: fallbackData, error: fallbackError } = await fallbackQuery;
            
            if (fallbackError) {
              throw fallbackError;
            }
            
            // Map the data to include null document fields
            return (fallbackData || []).map(payment => ({
              id: payment.id,
              trainer_id: payment.trainer_id,
              trainer_name: payment.trainers ? 
                `${payment.trainers.first_name} ${payment.trainers.last_name}` : 
                "Unknown",
              payment_date: payment.payment_date,
              amount: payment.amount || 0,
              payment_method: payment.payment_method,
              transaction_id: payment.transaction_id,
              notes: payment.notes,
              document_url: null, // Add missing fields with null values
              document_name: null
            }));
          }
          
          // For other types of errors, throw them
          console.error("Error fetching trainer payment history:", error);
          throw error;
        }
        
        if (!data) {
          return [];
        }
        
        // Format the data
        return data.map(payment => ({
          id: payment.id,
          trainer_id: payment.trainer_id,
          trainer_name: payment.trainers ? 
            `${payment.trainers.first_name} ${payment.trainers.last_name}` : 
            "Unknown",
          payment_date: payment.payment_date,
          amount: payment.amount || 0,
          payment_method: payment.payment_method,
          transaction_id: payment.transaction_id,
          notes: payment.notes,
          document_url: payment.document_url,
          document_name: payment.document_name
        }));
      } catch (error) {
        // Handle other general errors
        console.error("Error fetching trainer payment history:", error);
        toast.error("Failed to fetch payment history");
        throw error;
      }
    },
    staleTime: 0, // Make it always refetch when component is mounted
    refetchOnWindowFocus: true // Refetch when window regains focus
  });

  const handleViewDetails = (payment: TrainerPayment) => {
    setSelectedPayment(payment);
    setDetailsOpen(true);
  };
  
  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['trainer-payments'] }); 
    toast.success("Refreshing payment data");
  };
  
  const formatPaymentMethod = (method: string) => {
    switch(method) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'cash': return 'Cash';
      case 'check': return 'Check';
      case 'other': return 'Other';
      default: return method;
    }
  };

  // If there's an error with document_url column, we should inform the user
  if (error && (error as any)?.message?.includes("column 'document_url' does not exist")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trainer Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-amber-600 mb-2">Database migration required</p>
            <p className="text-muted-foreground">
              The payment document feature requires a database update. Please run the SQL migration first.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Recent Trainer Payments</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              title="Refresh payment data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {showViewAll && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewAll(prev => !prev)}
              >
                {viewAll ? "Show Less" : "View All"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trainer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Method</TableHead>
                    {!isMobile && <TableHead>Document</TableHead>}
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.trainer_name}</TableCell>
                      <TableCell>
                        {payment.payment_date ? 
                          format(new Date(payment.payment_date), "MMM d, yyyy") : 
                          "-"
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPaymentMethod(payment.payment_method)}
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          {payment.document_url ? (
                            <a 
                              href={payment.document_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-500 hover:underline"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              <span className="text-xs">View</span>
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewDetails(payment)}
                        >
                          <ChevronRight className="h-4 w-4" />
                          <span className="sr-only">View details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No payment history available</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Payment Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[600px] pr-4">
            {selectedPayment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Trainer</h4>
                    <p className="text-base">{selectedPayment.trainer_name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Amount</h4>
                    <p className="text-base font-semibold">{formatCurrency(selectedPayment.amount)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Payment Date</h4>
                    <p className="text-base">
                      {selectedPayment.payment_date ? 
                        format(new Date(selectedPayment.payment_date), "PPP") : 
                        "-"
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Payment Method</h4>
                    <p className="text-base">{formatPaymentMethod(selectedPayment.payment_method)}</p>
                  </div>
                </div>
                
                {selectedPayment.transaction_id && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Transaction ID</h4>
                    <p className="text-base">{selectedPayment.transaction_id}</p>
                  </div>
                )}
                
                {selectedPayment.document_url && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Payment Document</h4>
                    <div className="mt-1 border rounded-md p-3 bg-slate-50 flex items-center">
                      <FileText className="h-5 w-5 text-blue-500 mr-2" />
                      <a 
                        href={selectedPayment.document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {selectedPayment.document_name || "Payment document.pdf"}
                      </a>
                    </div>
                  </div>
                )}
                
                {selectedPayment.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                    <div className="mt-1 border rounded-md p-3 bg-slate-50">
                      <p className="text-sm whitespace-pre-wrap">{selectedPayment.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
