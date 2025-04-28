
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ArrowUpRight, PlusCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useInvoices } from "@/hooks/useInvoices";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UnallocatedInvoicesReportProps {
  dateRange?: { from: Date; to: Date };
  branchId?: string;
  onRefresh?: () => void;
}

interface UnallocatedInvoice {
  id: string;
  invoice_number: string;
  status: string;
  issued_date: string;
  total: number;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    booking_id: string | null;
  }>;
}

export function UnallocatedInvoicesReport({ 
  dateRange,
  branchId,
  onRefresh 
}: UnallocatedInvoicesReportProps) {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { markAsPaid } = useInvoices();

  // Fetch unallocated invoices (invoices without associated bookings)
  const { data: unallocatedInvoices, isLoading } = useQuery({
    queryKey: ['unallocated-invoices', branchId, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      if (!branchId) return [];
      
      console.log(`Fetching unallocated invoices for branch ${branchId}`);
      
      try {
        // Get invoices with their items
        const { data: invoicesWithItems, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            id, 
            invoice_number, 
            status, 
            issued_date, 
            due_date, 
            total,
            client:client_id (
              id,
              first_name, 
              last_name, 
              email, 
              branch_id
            ),
            items:invoice_items (
              id,
              description,
              quantity,
              unit_price,
              amount,
              booking_id
            )
          `)
          .eq('client.branch_id', branchId)
          .in('status', ['sent', 'paid', 'overdue'])
          .order('issued_date', { ascending: false });
          
        if (invoicesError) {
          console.error("Error fetching invoices with items:", invoicesError);
          throw invoicesError;
        }
        
        if (dateRange?.from && dateRange?.to) {
          console.log(`Filtering by date range: ${dateRange.from.toISOString()} to ${dateRange.to.toISOString()}`);
        }
        
        // Filter by date if date range is provided
        let filteredInvoices = invoicesWithItems || [];
        if (dateRange?.from && dateRange?.to) {
          filteredInvoices = filteredInvoices.filter(invoice => {
            const invoiceDate = new Date(invoice.issued_date);
            return invoiceDate >= dateRange.from && invoiceDate <= dateRange.to;
          });
        }
        
        // Filter only invoices that have no items with booking_id (unallocated)
        const unallocated = filteredInvoices.filter(invoice => 
          invoice.items?.length > 0 && 
          !invoice.items.some(item => item.booking_id !== null)
        );
        
        console.log(`Found ${unallocated.length} unallocated invoices out of ${filteredInvoices.length} total`);
        
        return unallocated as UnallocatedInvoice[];
      } catch (error) {
        console.error("Error fetching unallocated invoices:", error);
        throw error;
      }
    },
    enabled: !!branchId,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['unallocated-invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
      
      if (onRefresh) {
        onRefresh();
      }
      
      toast.success("Unallocated invoices data refreshed");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  // Calculate total unallocated amount
  const totalUnallocated = unallocatedInvoices?.reduce((sum, invoice) => sum + invoice.total, 0) || 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Unallocated Invoices</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Invoices without associated class bookings: {unallocatedInvoices?.length || 0} | 
            Total: {formatCurrency(totalUnallocated)}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
        >
          {refreshing || isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {unallocatedInvoices && unallocatedInvoices.length > 0 ? (
          <>
            <Alert className="mb-4">
              <AlertDescription>
                These invoices need to be manually assigned to classes or have their items updated with booking references.
                Click on an invoice to view and update its details.
              </AlertDescription>
            </Alert>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unallocatedInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        {invoice.client?.first_name} {invoice.client?.last_name}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.issued_date), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        {invoice.items?.map((item, idx) => (
                          <div key={idx} className="text-xs truncate max-w-[200px]">
                            {item.description} ({item.quantity} x {formatCurrency(item.unit_price)})
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                            invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No unallocated invoices found for the selected period</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
