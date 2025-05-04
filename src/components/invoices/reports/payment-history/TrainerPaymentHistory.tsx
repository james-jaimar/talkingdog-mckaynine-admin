
import { useState } from "react";
import { useTrainerPaymentHistory } from "@/hooks/useTrainerPaymentHistory";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { TrainerPaymentHistoryItem } from "@/hooks/trainer-payments/types";
import Link from "next/link";
import { PaymentMethodBadge } from "../PaymentMethodBadge";
import { Badge } from "@/components/ui/badge";

interface TrainerPaymentHistoryProps {
  limit?: number;
  showViewAll?: boolean;
}

export function TrainerPaymentHistory({ limit, showViewAll = false }: TrainerPaymentHistoryProps) {
  const { data: payments = [], isLoading } = useTrainerPaymentHistory({ limit });

  const handleViewDocument = (documentUrl?: string) => {
    if (documentUrl) {
      window.open(documentUrl, "_blank");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
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
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No payment records found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Payments</CardTitle>
        {showViewAll && (
          <Link href="/financial-reports/payment-documents">
            <Button variant="outline" size="sm">
              View All Documents
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Document</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {new Date(payment.paymentDate).toLocaleDateString()}
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
                    {payment.documentUrl ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => handleViewDocument(payment.documentUrl)}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        N/A
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
