
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/dashboard/financial/DateRangePicker";
import { useTrainerPaymentHistory } from "@/hooks/useTrainerPaymentHistory";
import { formatCurrency } from "@/lib/formatters";
import { PaymentMethodBadge } from "@/components/invoices/reports/PaymentMethodBadge";
import { FileText, Download, Loader2 } from "lucide-react";
import { TrainerPaymentSummary } from "@/components/invoices/reports/payment-documents/TrainerPaymentSummary";
import { saveAs } from 'file-saver';
import { useToast } from "@/components/ui/use-toast";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

export default function PaymentDocuments() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 1)), // Default to last month
    to: endOfMonth(new Date())
  });

  // Fetch payment history with our date filters
  const { data: payments = [], isLoading } = useTrainerPaymentHistory({
    limit: 100, // Fetch more records for the dedicated page
    startDate: dateRange.from,
    endDate: dateRange.to
  });

  // Group payments by trainer
  const paymentsByTrainer = payments.reduce((acc, payment) => {
    const trainerName = payment.trainerName || 'Unknown';
    
    if (!acc[trainerName]) {
      acc[trainerName] = {
        trainer: trainerName,
        payments: [],
        totalAmount: 0
      };
    }
    
    acc[trainerName].payments.push(payment);
    acc[trainerName].totalAmount += payment.amount;
    
    return acc;
  }, {} as Record<string, { trainer: string; payments: typeof payments; totalAmount: number }>);

  const trainerSummaries = Object.values(paymentsByTrainer).sort(
    (a, b) => b.totalAmount - a.totalAmount
  );

  const handleViewDocument = (documentUrl?: string) => {
    if (documentUrl) {
      window.open(documentUrl, "_blank");
    } else {
      toast({
        title: "Document Not Available",
        description: "This payment doesn't have an associated document.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadDocument = async (documentUrl?: string, documentName?: string) => {
    if (!documentUrl) {
      toast({
        title: "Document Not Available",
        description: "This payment doesn't have an associated document.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const fileName = documentName || `payment-remittance-${Date.now()}.pdf`;
      
      saveAs(blob, fileName);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download the document. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <RequireAdmin>
      <DashboardLayout>
        <Helmet>
          <title>Payment Documents - McKaynine Training Centre</title>
        </Helmet>
        
        <div className="container mx-auto py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-3xl font-bold">Payment Documents</h1>
            <DateRangePicker 
              dateRange={dateRange} 
              onDateRangeChange={(range) => setDateRange({
                from: range.from,
                to: range.to || endOfMonth(new Date())
              })} 
            />
          </div>

          {/* Trainer Payment Summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {trainerSummaries.map((summary) => (
              <TrainerPaymentSummary
                key={summary.trainer}
                trainerName={summary.trainer}
                paymentCount={summary.payments.length}
                totalAmount={summary.totalAmount}
              />
            ))}
            
            {isLoading && (
              <Card className="col-span-full flex justify-center items-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </Card>
            )}
            
            {trainerSummaries.length === 0 && !isLoading && (
              <Card className="col-span-full">
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No payment summaries available for the selected period.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment Documents Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No payment documents found for the selected period.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Trainer</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{payment.trainerName}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{payment.className}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(payment.classDate).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <PaymentMethodBadge method={payment.paymentMethod} />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!payment.documentUrl}
                                onClick={() => handleViewDocument(payment.documentUrl)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!payment.documentUrl}
                                onClick={() => handleDownloadDocument(
                                  payment.documentUrl, 
                                  payment.documentName
                                )}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
