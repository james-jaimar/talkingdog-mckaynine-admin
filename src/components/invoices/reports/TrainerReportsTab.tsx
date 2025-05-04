
import { useTrainerPaymentData } from "@/hooks/useTrainerPaymentData";
import { TrainerPaymentsSummary } from "./TrainerPaymentsSummary";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrainerPaymentHistory } from "./payment-history/TrainerPaymentHistory";
import { useTrainerActionHandlers } from "./hooks/useTrainerActionHandlers";
import { MarkAsUnpaidDialog } from "./dialogs/MarkAsUnpaidDialog";
import { FixZeroAmountsDialog } from "./dialogs/FixZeroAmountsDialog";
import { ActionButtons } from "./trainer-actions/ActionButtons";

interface TrainerReportsTabProps {
  dateRange: { from: Date; to: Date };
  branchId?: string;
}

export function TrainerReportsTab({ dateRange, branchId }: TrainerReportsTabProps) {
  const { data: trainersData, isLoading, error, refetch } = useTrainerPaymentData(branchId, dateRange);
  
  const {
    markUnpaidDialogOpen,
    setMarkUnpaidDialogOpen,
    fixZeroAmountsDialogOpen,
    setFixZeroAmountsDialogOpen,
    selectedScheduleIds,
    isProcessing,
    handleMarkAsUnpaid,
    handleFixZeroAmounts,
    findFirstTrainerWithZeroAmounts,
    refreshAllData,
    fixZeroPayments,
    confirmMarkAsUnpaid
  } = useTrainerActionHandlers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !trainersData) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading trainer data: {error?.message || "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Check if any trainer has zero-amount payments that need fixing
  // Only consider zero amounts for trainers who should actually get a commission
  const hasZeroAmountPayments = trainersData.some(trainer => 
    trainer.classDetails.some(cls => cls.hasZeroAmountPayment && !cls.hasZeroCommission)
  );
  
  const formattedTrainers = trainersData.map(trainer => ({
    id: trainer.id,
    trainerName: trainer.trainerName,
    totalEarned: trainer.totalEarned,
    paid: trainer.paid,
    pending: trainer.pending,
    potentialEarnings: trainer.potentialEarnings,
    classesCount: trainer.classesCount,
    clients: trainer.clients,
    lastPaymentDate: trainer.lastPaymentDate,
    classDetails: trainer.classDetails,
    hasZeroAmountPayments: trainer.classDetails.some(cls => cls.hasZeroAmountPayment && !cls.hasZeroCommission),
    hasZeroCommissionClasses: trainer.hasZeroCommissionClasses,
    hasUnpaidCommission: trainer.hasUnpaidCommission
  }));
  
  // Handler for global "Fix Zero Amount Payments" button
  const handleGlobalFixZeroAmounts = () => {
    const trainerWithZero = findFirstTrainerWithZeroAmounts(trainersData);
    if (trainerWithZero) {
      handleFixZeroAmounts(trainerWithZero.id, trainersData);
    }
  };

  return (
    <div className="space-y-6">
      <ActionButtons 
        onRefresh={refreshAllData}
        onFixZeroAmounts={handleGlobalFixZeroAmounts}
        hasZeroAmountPayments={hasZeroAmountPayments}
        isProcessing={isProcessing}
      />
      
      <TrainerPaymentsSummary 
        trainers={formattedTrainers}
        isLoading={isLoading}
        dateRange={dateRange}
        branchId={branchId}
        onMarkAsUnpaid={(trainerId) => handleMarkAsUnpaid(trainerId, trainersData)}
        onFixZeroAmounts={(trainerId) => handleFixZeroAmounts(trainerId, trainersData)}
        isProcessing={isProcessing}
      />
      
      <TrainerPaymentHistory limit={5} showViewAll />
      
      <MarkAsUnpaidDialog
        open={markUnpaidDialogOpen}
        onOpenChange={setMarkUnpaidDialogOpen}
        onConfirm={confirmMarkAsUnpaid}
        scheduleCount={selectedScheduleIds.length}
        isProcessing={isProcessing}
      />
      
      <FixZeroAmountsDialog
        open={fixZeroAmountsDialogOpen}
        onOpenChange={setFixZeroAmountsDialogOpen}
        onConfirm={fixZeroPayments}
        scheduleCount={selectedScheduleIds.length}
        isProcessing={isProcessing}
      />
    </div>
  );
}
