
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface TrainerPaymentsTableProps {
  trainers: Array<{
    id: string;
    trainerName: string;
    totalEarned: number;
    paid: number;
    pending: number;
    potentialEarnings?: number;
    classesCount: number;
    clients: number;
    lastPaymentDate?: string;
    classDetails?: any[];
    invoicesCount?: number;
    scheduleIds?: string[];
  }>;
  onMarkForPayment: (trainerId: string) => void;
  onMarkAsUnpaid?: (trainerId: string) => void;
}

export function TrainerPaymentsTable({ trainers, onMarkForPayment, onMarkAsUnpaid }: TrainerPaymentsTableProps) {
  console.log("TrainerPaymentsTable rendering with trainers:", trainers);
  
  // Check if there are any trainers with classes
  const trainersWithClasses = trainers.filter(t => t.classesCount > 0);
  
  // Check if any trainers have actual paid amounts
  const anyActualPayments = trainers.some(t => t.paid > 0);
  
  if (!trainers || trainers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center p-6">
          <p className="text-muted-foreground">No trainer data available</p>
        </CardContent>
      </Card>
    );
  }

  // Show message if no trainers have any classes
  if (trainersWithClasses.length === 0) {
    return (
      <Card>
        <CardContent className="text-center p-6">
          <p className="text-muted-foreground">No classes assigned to trainers yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!anyActualPayments && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Displaying potential earnings based on class configurations and bookings. 
            No actual payments have been processed in this system yet.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trainer</TableHead>
              <TableHead className="text-right">Total Commission</TableHead>
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
            {trainersWithClasses.map((trainer, index) => (
              <TrainerPaymentsRow 
                key={trainer.id}
                trainer={trainer}
                index={index}
                onMarkForPayment={onMarkForPayment}
                onMarkAsUnpaid={onMarkAsUnpaid}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
