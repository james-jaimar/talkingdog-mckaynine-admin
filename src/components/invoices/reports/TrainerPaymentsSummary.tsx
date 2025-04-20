
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { formatCurrency } from "@/lib/formatters";
import { Loader2 } from "lucide-react";

type TrainerPayment = {
  id: string;
  trainerName: string;
  totalEarned: number;
  paid: number;
  pending: number;
  invoicesCount: number;
  lastPaymentDate?: string;
};

interface TrainerPaymentsSummaryProps {
  trainers: TrainerPayment[];
  isLoading: boolean;
}

// This component is kept for backward compatibility but is no longer used in the main Financial Reports page
export function TrainerPaymentsSummary({ trainers, isLoading }: TrainerPaymentsSummaryProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Trainer Payments</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-36">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!trainers || trainers.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Trainer Payments</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground py-4">No trainer payment data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Trainer Payments</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trainer</TableHead>
              <TableHead className="text-right">Total Revenue</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Invoices</TableHead>
              <TableHead className="text-right">Last Payment</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainers.map((trainer) => (
              <TableRow key={trainer.id}>
                <TableCell className="font-medium">{trainer.trainerName}</TableCell>
                <TableCell className="text-right">{formatCurrency(trainer.totalEarned)}</TableCell>
                <TableCell className="text-right">{formatCurrency(trainer.paid)}</TableCell>
                <TableCell className="text-right">{formatCurrency(trainer.pending)}</TableCell>
                <TableCell className="text-right">{trainer.invoicesCount}</TableCell>
                <TableCell className="text-right">
                  {trainer.lastPaymentDate 
                    ? new Date(trainer.lastPaymentDate).toLocaleDateString('en-ZA')
                    : 'Never'}
                </TableCell>
                <TableCell className="text-right">
                  {trainer.pending > 0 ? (
                    <ExtendedBadge variant="amber">Payment Due</ExtendedBadge>
                  ) : (
                    <ExtendedBadge variant="green">Paid</ExtendedBadge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
