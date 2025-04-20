
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExtendedBadge } from "@/components/ui/badge-variants";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TrainerPaymentsTableProps {
  trainers: Array<{
    id: string;
    trainerName: string;
    totalEarned: number;
    paid: number;
    pending: number;
    classesCount: number;
    clients: number;
    lastPaymentDate?: string;
    invoicesCount?: number;
    scheduleIds?: string[];
  }>;
  onMarkForPayment: (trainerId: string) => void;
}

export function TrainerPaymentsTable({ trainers, onMarkForPayment }: TrainerPaymentsTableProps) {
  if (!trainers || trainers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center p-6">
          <p className="text-muted-foreground">No trainer payment data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trainer</TableHead>
            <TableHead className="text-right">Total Revenue</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Outstanding</TableHead>
            <TableHead className="text-center">Classes</TableHead>
            <TableHead className="text-center">Clients</TableHead>
            <TableHead className="text-right">Last Payment</TableHead>
            <TableHead className="text-right">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trainers.map((trainer) => (
            <TableRow key={trainer.id}>
              <TableCell className="font-medium">{trainer.trainerName}</TableCell>
              <TableCell className="text-right">{formatCurrency(trainer.totalEarned)}</TableCell>
              <TableCell className="text-right">{formatCurrency(trainer.paid)}</TableCell>
              <TableCell className="text-right">{formatCurrency(trainer.pending)}</TableCell>
              <TableCell className="text-center">{trainer.classesCount}</TableCell>
              <TableCell className="text-center">{trainer.clients}</TableCell>
              <TableCell className="text-right">
                {trainer.lastPaymentDate 
                  ? new Date(trainer.lastPaymentDate).toLocaleDateString()
                  : 'Never'}
              </TableCell>
              <TableCell className="text-right">
                {trainer.pending > 0 ? (
                  <ExtendedBadge variant="amber">Payment Due</ExtendedBadge>
                ) : (
                  <ExtendedBadge variant="green">Paid</ExtendedBadge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onMarkForPayment(trainer.id)}
                  disabled={trainer.pending <= 0}
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Mark for Payment
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
