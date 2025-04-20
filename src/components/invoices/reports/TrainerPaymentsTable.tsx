
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { TrainerPaymentsRow } from "./TrainerPaymentsRow";

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
    classDetails?: any[];
    invoicesCount?: number;
    scheduleIds?: string[];
  }>;
  onMarkForPayment: (trainerId: string) => void;
}

export function TrainerPaymentsTable({ trainers, onMarkForPayment }: TrainerPaymentsTableProps) {
  console.log("TrainerPaymentsTable rendering with trainers:", trainers);
  
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
            <TrainerPaymentsRow 
              key={trainer.id}
              trainer={trainer}
              onMarkForPayment={onMarkForPayment}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
