
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
import { TrainerPaymentData } from "./types";

interface TrainerPaymentTableProps {
  trainers: TrainerPaymentData[];
}

export function TrainerPaymentTable({ trainers }: TrainerPaymentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Trainer</TableHead>
          <TableHead className="text-right">Total Revenue</TableHead>
          <TableHead className="text-right">Allocated</TableHead>
          <TableHead className="text-right">Paid</TableHead>
          <TableHead className="text-right">Pending</TableHead>
          <TableHead className="text-center">Classes</TableHead>
          <TableHead className="text-center">Clients</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trainers.map((trainer) => (
          <TableRow key={trainer.id}>
            <TableCell className="font-medium">{trainer.trainerName}</TableCell>
            <TableCell className="text-right">{formatCurrency(trainer.totalEarned)}</TableCell>
            <TableCell className="text-right">{formatCurrency(trainer.allocatedAmount)}</TableCell>
            <TableCell className="text-right">{formatCurrency(trainer.paidAmount)}</TableCell>
            <TableCell className="text-right">{formatCurrency(trainer.pendingAmount)}</TableCell>
            <TableCell className="text-center">{trainer.classesCount}</TableCell>
            <TableCell className="text-center">{trainer.clients}</TableCell>
            <TableCell className="text-right">
              {trainer.pendingAmount > 0 ? (
                <ExtendedBadge variant="amber">Payment Due</ExtendedBadge>
              ) : (
                <ExtendedBadge variant="green">Paid</ExtendedBadge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
