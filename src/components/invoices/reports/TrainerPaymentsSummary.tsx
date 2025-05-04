
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrainerPaymentsTable } from "./TrainerPaymentsTable";
import { TrainerPaymentDialog } from "./TrainerPaymentDialog";
import { useState } from "react";

interface TrainerPaymentsSummaryProps {
  trainers: Array<{
    id: string;
    trainerName: string;
    totalEarned: number;
    paid: number;
    pending: number;
    classesCount: number;
    clients: number;
    lastPaymentDate?: string;
    scheduleIds?: string[];
    invoicesCount?: number;
    hasZeroAmountPayments?: boolean;
    hasZeroCommissionClasses?: boolean;
    hasUnpaidCommission?: boolean;
  }>;
  isLoading: boolean;
  isProcessing?: boolean;
  dateRange?: { from: Date; to: Date };
  branchId?: string;
  onMarkAsUnpaid?: (trainerId: string) => void;
  onFixZeroAmounts?: (trainerId: string) => void;
}

export function TrainerPaymentsSummary({ 
  trainers, 
  isLoading, 
  dateRange = { from: new Date(), to: new Date() },
  branchId,
  onMarkAsUnpaid,
  onFixZeroAmounts,
  isProcessing = false
}: TrainerPaymentsSummaryProps) {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  
  const openPaymentDialog = (trainerId: string) => {
    if (isProcessing) return;
    
    const trainer = trainers.find(t => t.id === trainerId);
    setSelectedTrainerId(trainerId);
    // Use the scheduleIds from the trainer data if available
    setSelectedScheduleIds(trainer?.scheduleIds || []);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Trainer Payments Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <TrainerPaymentsTable 
            trainers={trainers} 
            onMarkForPayment={openPaymentDialog}
            onMarkAsUnpaid={onMarkAsUnpaid}
            onFixZeroAmounts={onFixZeroAmounts}
            isProcessing={isProcessing}
          />
        </CardContent>
      </Card>
      
      {selectedTrainerId && (
        <TrainerPaymentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          trainerId={selectedTrainerId}
          dateRange={dateRange}
          branchId={branchId}
          scheduleIds={selectedScheduleIds}
        />
      )}
    </div>
  );
}
