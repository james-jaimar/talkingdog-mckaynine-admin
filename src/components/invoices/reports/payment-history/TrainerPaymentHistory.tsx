import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentDetailsPanel } from "../payment-dialog/PaymentDetailsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { jsPDF } from "jspdf";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";

interface PaymentHistoryItem {
  id: string;
  trainer_id: string;
  payment_date: string;
  amount: number;
  status: string;
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
  trainer_name: string;
  classes_count: number;
  classes: TrainerClassDetail[];
}

interface TrainerPaymentHistoryProps {
  trainerId?: string;
  limit?: number;
  showViewAll?: boolean;
}

export function TrainerPaymentHistory({ trainerId, limit = 5, showViewAll = true }: TrainerPaymentHistoryProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistoryItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("recent");
  const [viewAllLimit, setViewAllLimit] = useState(limit);
  
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['trainer-payments-history', trainerId, activeTab === "all" ? viewAllLimit : limit],
    queryFn: async () => {
      try {
        let query = supabase
          .from('trainer_payments')
          .select(`
            id,
            trainer_id,
            payment_date,
            amount,
            status,
            payment_method,
            transaction_id,
            notes,
            class_schedule_id,
            trainers:trainer_id (
              id, 
              first_name,
              last_name
            )
          `)
          .eq('status', 'paid')
          .order('payment_date', { ascending: false });

        if (trainerId) {
          query = query.eq('trainer_id', trainerId);
        }
        
        // Limit results
        query = query.limit(activeTab === "all" ? viewAllLimit : limit);
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (!data || data.length === 0) return [];
        
        // Group payments by date and trainer
        const groupedPayments: Record<string, Record<string, PaymentHistoryItem>> = {};
        
        for (const payment of data) {
          const paymentDate = new Date(payment.payment_date).toISOString().split('T')[0];
          const key = `${paymentDate}_${payment.trainer_id}`;
          
          if (!groupedPayments[key]) {
            groupedPayments[key] = {
              [payment.id]: {
                id: payment.id,
                trainer_id: payment.trainer_id,
                payment_date: payment.payment_date,
                amount: payment.amount || 0,
                status: payment.status,
                payment_method: payment.payment_method,
                transaction_id: payment.transaction_id,
                notes: payment.notes,
                trainer_name: `${payment.trainers.first_name} ${payment.trainers.last_name}`,
                classes_count: 1,
                classes: []
              }
            };
          } else {
            const firstPaymentId = Object.keys(groupedPayments[key])[0];
            groupedPayments[key][firstPaymentId].classes_count += 1;
          }
        }
        
        // Convert to array
        const result = Object.values(groupedPayments).map(obj => Object.values(obj)[0]);
        
        // For each grouped payment, fetch the class details
        for (const payment of result) {
          // Get all payment records for this trainer and date
          const { data: paymentRecords } = await supabase
            .from('trainer_payments')
            .select('class_schedule_id')
            .eq('trainer_id', payment.trainer_id)
            .eq('status', 'paid')
            .like('payment_date', `${new Date(payment.payment_date).toISOString().split('T')[0]}%`);
        
          if (paymentRecords && paymentRecords.length > 0) {
            const scheduleIds = paymentRecords.map(r => r.class_schedule_id);
          
            // Fetch class details for these schedules
            const { data: classDetails } = await supabase
              .from('class_schedules')
              .select(`
                id,
                start_time,
                classes:class_id (
                  id,
                  name,
                  trainer_fee_type,
                  trainer_fee_value
                )
              `)
              .in('id', scheduleIds);
            
            if (classDetails && classDetails.length > 0) {
              const fetchedClasses: TrainerClassDetail[] = classDetails.map(detail => ({
                scheduleId: detail.id,
                className: detail.classes?.name || 'Unknown Class',
                classDate: detail.start_time,
                revenue: 0, // Placeholder
                potentialRevenue: 0, // Placeholder
                bookings: 0, // Placeholder
                isPaid: true,
                scheduleDate: new Date(detail.start_time)
              }));
            
              payment.classes = fetchedClasses;
            }
          }
        }
        
        return result;
      } catch (error) {
        console.error("Error fetching payment history:", error);
        return [];
      }
    },
    enabled: activeTab === "recent" || (activeTab === "all" && viewAllLimit > 0),
  });
  
  useEffect(() => {
    if (activeTab === "all" && payments.length === viewAllLimit) {
      // If we've reached the limit, increase it for the next load more
      setViewAllLimit(prev => prev + 10);
    }
  }, [payments, activeTab, viewAllLimit]);
  
  const handleViewDetails = (payment: PaymentHistoryItem) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  };
  
  const handleViewAllClick = () => {
    setActiveTab("all");
  };
  
  const handleLoadMore = () => {
    setViewAllLimit(prev => prev + 10);
  };
  
  const handleExportPdf = () => {
    if (!payments || payments.length === 0) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("Trainer Payment History", 14, 20);
    
    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    let y = 40;
    
    // Add payment records
    payments.forEach((payment, index) => {
      // Check if we need a new page
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(14);
      doc.text(`Payment #${index + 1}`, 14, y);
      y += 8;
      
      doc.setFontSize(11);
      doc.text(`Trainer: ${payment.trainer_name}`, 14, y);
      y += 6;
      
      doc.text(`Date: ${new Date(payment.payment_date).toLocaleDateString()}`, 14, y);
      y += 6;
      
      doc.text(`Classes: ${payment.classes_count}`, 14, y);
      y += 6;
      
      if (payment.payment_method) {
        doc.text(`Method: ${payment.payment_method}`, 14, y);
        y += 6;
      }
      
      doc.text(`Status: ${payment.status}`, 14, y);
      y += 10;
    });
    
    // Save the PDF
    doc.save("trainer-payment-history.pdf");
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No payment records found.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payment History</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExportPdf}>
          <FileDown className="h-4 w-4 mr-2" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="all">All Payments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.slice(0, limit).map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.trainer_name}</TableCell>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.classes_count}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(payment)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {showViewAll && payments.length >= limit && (
              <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={handleViewAllClick}>
                  View All Payments
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="all">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.trainer_name}</TableCell>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.payment_method || "Not specified"}</TableCell>
                    <TableCell>{payment.classes_count}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(payment)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={handleLoadMore}>
                Load More
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Payment Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Trainer:</div>
                <div>{selectedPayment.trainer_name}</div>
                
                <div className="font-medium">Payment Date:</div>
                <div>{new Date(selectedPayment.payment_date).toLocaleDateString()}</div>
                
                <div className="font-medium">Payment Method:</div>
                <div>{selectedPayment.payment_method || "Not specified"}</div>
                
                {selectedPayment.transaction_id && (
                  <>
                    <div className="font-medium">Transaction ID:</div>
                    <div>{selectedPayment.transaction_id}</div>
                  </>
                )}
                
                <div className="font-medium">Status:</div>
                <div>{selectedPayment.status}</div>
                
                <div className="font-medium">Classes Count:</div>
                <div>{selectedPayment.classes_count}</div>
              </div>
              
              {selectedPayment.notes && (
                <div className="mt-4">
                  <div className="font-medium mb-1">Notes:</div>
                  <div className="border rounded p-2 bg-muted/30 text-sm">
                    {selectedPayment.notes}
                  </div>
                </div>
              )}
              
              {selectedPayment.classes && selectedPayment.classes.length > 0 && (
                <div className="mt-4">
                  <div className="font-medium mb-2">Classes:</div>
                  <ul className="border rounded p-2 bg-muted/30 text-sm space-y-1">
                    {selectedPayment.classes.map(cls => (
                      <li key={cls.scheduleId} className="flex justify-between">
                        <span>{cls.className} ({new Date(cls.classDate).toLocaleDateString()})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
