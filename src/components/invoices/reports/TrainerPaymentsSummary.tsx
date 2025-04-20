
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
    invoicesCount?: number; // Made optional since we're using classesCount now
  }>;
  isLoading: boolean;
}

export function TrainerPaymentsSummary({ trainers, isLoading }: TrainerPaymentsSummaryProps) {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const openPaymentDialog = (trainerId: string) => {
    setSelectedTrainerId(trainerId);
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
          />
        </CardContent>
      </Card>
      
      {selectedTrainerId && (
        <TrainerPaymentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          trainerId={selectedTrainerId}
          dateRange={{ from: new Date(), to: new Date() }} // Provide a default date range
          branchId={undefined} // Set to undefined as default
        />
      )}
    </div>
  );
}
