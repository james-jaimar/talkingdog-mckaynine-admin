
import { useState } from "react";
import { useTrainerPaymentHistory } from "@/hooks/useTrainerPaymentHistory";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { TrainerPaymentHistoryItem } from "@/hooks/trainer-payments/types";
import { FileText, Search } from "lucide-react";
import { PaymentMethodBadge } from "../PaymentMethodBadge";

export function PaymentDocumentsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Get all payment history without limit
  const { data: allPayments = [], isLoading } = useTrainerPaymentHistory({ limit: 100 });

  // Group payments by trainer
  const paymentsByTrainer = allPayments.reduce((acc, payment) => {
    const trainerId = payment.id.split('-')[0]; // Using a part of the ID as trainer ID for grouping
    
    if (!acc[trainerId]) {
      acc[trainerId] = {
        id: trainerId,
        name: payment.trainerName,
        payments: [],
        totalAmount: 0
      };
    }
    
    acc[trainerId].payments.push(payment);
    acc[trainerId].totalAmount += payment.amount;
    
    return acc;
  }, {} as Record<string, { id: string; name: string; payments: TrainerPaymentHistoryItem[]; totalAmount: number }>);

  // Filter payments based on search query
  const filteredPayments = allPayments.filter(payment => 
    payment.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTrainers = Object.values(paymentsByTrainer).filter(trainer => 
    trainer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle document view
  const handleViewDocument = (documentUrl?: string) => {
    if (documentUrl) {
      window.open(documentUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by trainer or class..."
            className="pl-8 w-full sm:w-[250px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="byTrainer">By Trainer</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <Card className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Trainer</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Document</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading payment documents...
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        {searchQuery ? "No payments match your search" : "No payment documents found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>{payment.trainerName}</TableCell>
                        <TableCell>{payment.className}</TableCell>
                        <TableCell>
                          <PaymentMethodBadge method={payment.paymentMethod} />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {payment.documentUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDocument(payment.documentUrl)}
                            >
                              <FileText className="h-4 w-4 mr-1" /> View
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="byTrainer" className="space-y-4">
          <Card className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trainer</TableHead>
                    <TableHead className="text-center">Payments</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        Loading trainer data...
                      </TableCell>
                    </TableRow>
                  ) : filteredTrainers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        {searchQuery ? "No trainers match your search" : "No trainers found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTrainers.map((trainer) => (
                      <TableRow key={trainer.id}>
                        <TableCell>{trainer.name}</TableCell>
                        <TableCell className="text-center">{trainer.payments.length}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(trainer.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
