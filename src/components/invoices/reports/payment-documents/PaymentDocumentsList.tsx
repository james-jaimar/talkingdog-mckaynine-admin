
import { useState } from "react";
import { useTrainerPaymentHistory } from "@/hooks/useTrainerPaymentHistory";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { TrainerPaymentHistoryItem } from "@/hooks/trainer-payments/types";
import { PaymentMethodBadge } from "../PaymentMethodBadge";
import { TrainerPaymentSummary } from "./TrainerPaymentSummary";

interface PaymentDocumentsListProps {
  limit?: number;
}

export function PaymentDocumentsList({ limit }: PaymentDocumentsListProps) {
  const { data: payments = [], isLoading } = useTrainerPaymentHistory({});
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);

  const handleViewDocument = (documentUrl?: string) => {
    if (documentUrl) {
      window.open(documentUrl, "_blank");
    }
  };

  // Group payments by trainer
  const trainerPayments = payments.reduce((acc, payment) => {
    const trainerId = payment.id.split('-')[0]; // Assuming ID has trainer ID as prefix
    const trainerName = payment.trainerName || 'Unknown Trainer';
    
    if (!acc[trainerId]) {
      acc[trainerId] = {
        id: trainerId,
        name: trainerName,
        payments: [],
        totalAmount: 0,
      };
    }
    
    acc[trainerId].payments.push(payment);
    acc[trainerId].totalAmount += payment.amount;
    
    return acc;
  }, {} as Record<string, { id: string; name: string; payments: TrainerPaymentHistoryItem[]; totalAmount: number }>);

  // Convert to array for display
  const trainerSummaries = Object.values(trainerPayments);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Documents</CardTitle>
          <CardDescription>View and download payment records</CardDescription>
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
          <CardTitle>Payment Documents</CardTitle>
          <CardDescription>View and download payment records</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No payment records found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trainer payment summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trainerSummaries.map(trainer => (
          <TrainerPaymentSummary
            key={trainer.id}
            trainerName={trainer.name}
            paymentCount={trainer.payments.length}
            totalAmount={trainer.totalAmount}
          />
        ))}
      </div>

      {/* Payment documents table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payment Documents</CardTitle>
          <CardDescription>
            Financial records for all trainer payments
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                    <TableCell>
                      {payment.trainerName || "Unknown Trainer"}
                    </TableCell>
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
                        {payment.documentUrl ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center"
                              onClick={() => handleViewDocument(payment.documentUrl)}
                            >
                              <FileText className="h-4 w-4" />
                              <span className="hidden sm:inline ml-1">View</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center"
                              onClick={() => handleViewDocument(payment.documentUrl)}
                            >
                              <Download className="h-4 w-4" />
                              <span className="hidden sm:inline ml-1">Download</span>
                            </Button>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">No document</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
