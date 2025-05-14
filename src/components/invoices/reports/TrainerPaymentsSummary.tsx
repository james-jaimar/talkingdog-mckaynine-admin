
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrainerPaymentsTable } from "./TrainerPaymentsTable";
import { TrainerPaymentDialog } from "./TrainerPaymentDialog";
import { useState } from "react";
import { TrainerPaymentData } from "@/hooks/trainer-payments/types";

interface TrainerPaymentsSummaryProps {
  trainers: TrainerPaymentData[];
  isLoading: boolean;
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
  onFixZeroAmounts
}: TrainerPaymentsSummaryProps) {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  
  const openPaymentDialog = (trainerId: string) => {
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
