
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
import { Info, AlertTriangle } from "lucide-react";

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
    hasZeroAmountPayments?: boolean;
    hasZeroCommissionClasses?: boolean;
    hasUnpaidCommission?: boolean;
  }>;
  onMarkForPayment: (trainerId: string) => void;
  onMarkAsUnpaid?: (trainerId: string) => void;
  onFixZeroAmounts?: (trainerId: string) => void;
  isProcessing?: boolean;
}

export function TrainerPaymentsTable({ 
  trainers, 
  onMarkForPayment, 
  onMarkAsUnpaid,
  onFixZeroAmounts,
  isProcessing = false
}: TrainerPaymentsTableProps) {
  console.log("TrainerPaymentsTable rendering with trainers:", trainers);
  
  // Check if there are any trainers with classes
  const trainersWithClasses = trainers.filter(t => t.classesCount > 0);
  
  // Check if any trainers have actual paid amounts
  const anyActualPayments = trainers.some(t => t.paid > 0);
  
  // Check for trainers with zero commission (those we don't want to flag as needing fixes)
  const anyZeroCommissionTrainers = trainers.some(t => 
    t.hasZeroCommissionClasses && 
    t.totalEarned === 0 && t.potentialEarnings === 0
  );
  
  // Check if any trainers have zero amount payments that need fixing
  // Improved logic: Only flag trainers who have zero amounts BUT are NOT zero commission trainers
  const anyZeroAmountPayments = trainers.some(t => {
    // Check if this trainer has payments that need fixing
    const needsFixes = t.hasZeroAmountPayments;
    
    // Only consider it needing fixes if:
    // 1. It has zero amount payments flagged
    // 2. It's NOT a zero commission trainer (important filter)
    return needsFixes && 
      !(t.hasZeroCommissionClasses && t.totalEarned === 0 && t.potentialEarnings === 0);
  });
  
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
      {anyZeroAmountPayments && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Some payment records have incorrect (zero) amounts. Use the "Fix Zero Amount Payments" 
            button to recalculate these payments.
          </AlertDescription>
        </Alert>
      )}
      
      {anyZeroCommissionTrainers && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Some trainers have classes configured with 0% commission. These trainers will 
            show "N/A" for payment amounts and cannot be marked for payment.
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
                onFixZeroAmounts={onFixZeroAmounts}
                isProcessing={isProcessing}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
