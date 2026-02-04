
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrainerPaymentsTable } from "./TrainerPaymentsTable";
import { TrainerPaymentDialog } from "./TrainerPaymentDialog";
import { TrainerStatementDialog } from "./TrainerStatementDialog";
import { useState, useMemo } from "react";
import { useTerm } from "@/context/TermContext";
import { useBranch } from "@/context/BranchContext";

interface TrainerPaymentsSummaryProps {
  trainers: Array<{
    id: string;
    trainerName: string;
    email?: string;
    totalEarned: number;
    paid: number;
    pending: number;
    classesCount: number;
    clients: number;
    lastPaymentDate?: string;
    scheduleIds?: string[];
    invoicesCount?: number;
    hasZeroAmountPayments?: boolean;
    classDetails?: any[];
  }>;
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
  
  // Statement dialog state
  const [statementDialogOpen, setStatementDialogOpen] = useState(false);
  const [statementTrainer, setStatementTrainer] = useState<typeof trainers[0] | null>(null);
  
  const { termData, selectedYear, selectedTermNumber } = useTerm();
  const { branches } = useBranch();
  
  // Get branch name from branchId for PDF branding
  const branchName = useMemo(() => {
    if (!branchId || !branches) return "delta";
    const branch = branches.find(b => b.id === branchId);
    if (branch?.name?.toLowerCase().includes("randburg")) return "randburg";
    if (branch?.name?.toLowerCase().includes("delta")) return "delta";
    return branch?.name?.toLowerCase() || "delta";
  }, [branchId, branches]);
  
  // Track selected schedule IDs for statement generation
  const [statementSelectedScheduleIds, setStatementSelectedScheduleIds] = useState<string[]>([]);

  const openPaymentDialog = (trainerId: string) => {
    const trainer = trainers.find(t => t.id === trainerId);
    setSelectedTrainerId(trainerId);
    // Use the scheduleIds from the trainer data if available
    setSelectedScheduleIds(trainer?.scheduleIds || []);
    setDialogOpen(true);
  };

  const openStatementDialog = (trainerId: string, selectedIds?: string[]) => {
    const trainer = trainers.find(t => t.id === trainerId);
    if (trainer) {
      setStatementTrainer(trainer);
      setStatementSelectedScheduleIds(selectedIds || []);
      setStatementDialogOpen(true);
    }
  };

  // Build term info string
  const termInfo = selectedTermNumber && selectedYear
    ? `Term ${selectedTermNumber}, ${selectedYear}`
    : "Current Term";

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
            onGenerateStatement={openStatementDialog}
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
      
      {statementTrainer && (
        <TrainerStatementDialog
          open={statementDialogOpen}
          onOpenChange={setStatementDialogOpen}
          trainer={statementTrainer}
          dateRange={dateRange}
          termInfo={termInfo}
          branchName={branchName}
          selectedScheduleIds={statementSelectedScheduleIds}
        />
      )}
    </div>
  );
}
