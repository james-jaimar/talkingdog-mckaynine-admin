
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useTrainerPaymentData } from "@/hooks/useTrainerPaymentData";
import { TrainerPaymentsSummary } from "./TrainerPaymentsSummary";
import { Loader2, AlertCircle, RefreshCw, Wrench } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrainerPaymentHistory } from "./payment-history/TrainerPaymentHistory";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMarkTrainerPaymentsUnpaid } from "@/hooks/useMarkTrainerPaymentsUnpaid";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useTerm } from "@/context/TermContext";

interface TrainerReportsTabProps {
  dateRange: { from: Date; to: Date };
  branchId?: string;
}

export function TrainerReportsTab({ dateRange, branchId }: TrainerReportsTabProps) {
  const queryClient = useQueryClient();
  const { data: trainersData, isLoading, error, refetch } = useTrainerPaymentData(branchId, dateRange);
  const [markUnpaidDialogOpen, setMarkUnpaidDialogOpen] = useState(false);
  const [fixZeroAmountsDialogOpen, setFixZeroAmountsDialogOpen] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  
  const markAsUnpaid = useMarkTrainerPaymentsUnpaid();
  const { termData } = useTerm();
  
  // Add effect to refresh data when term changes
  useEffect(() => {
    if (termData?.id) {
      console.log(`TrainerReportsTab: Term changed to ${termData.term_number}, refreshing data`);
      queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
      refetch();
    }
  }, [termData?.id, queryClient, refetch]);
  
  // Handle mark as unpaid for a specific trainer
  const handleMarkAsUnpaid = (trainerId: string) => {
    setSelectedTrainerId(trainerId);
    // Find trainer data to get all scheduleIds
    const trainer = trainersData?.find(t => t.id === trainerId);
    // Find paid schedules for this trainer
    const paidSchedules = trainer?.classDetails.filter(c => c.isPaid).map(c => c.scheduleId) || [];
    setSelectedScheduleIds(paidSchedules);
    setMarkUnpaidDialogOpen(true);
  };

  // Handle fix zero amounts for a specific trainer
  const handleFixZeroAmounts = (trainerId: string) => {
    setSelectedTrainerId(trainerId);
    // Find trainer data to get scheduleIds with zero amounts
    const trainer = trainersData?.find(t => t.id === trainerId);
    // Find schedules with zero amount payments for this trainer
    // Don't include those that have hasZeroCommission=true as those are intentional
    const zeroPaidSchedules = trainer?.classDetails
      .filter(c => c.hasZeroAmountPayment && !c.hasZeroCommission)
      .map(c => c.scheduleId) || [];
    setSelectedScheduleIds(zeroPaidSchedules);
    setFixZeroAmountsDialogOpen(true);
  };
  
  const refreshAllData = () => {
    queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
    queryClient.invalidateQueries({ queryKey: ['trainer-payment-history'] });
    refetch();
    toast.success("Payment data refreshed");
  };
  
  // Fix zero payments function
  const fixZeroPayments = () => {
    if (!selectedTrainerId) return;
    
    if (selectedScheduleIds.length === 0) {
      toast.info("No payment records with zero amounts found");
      setFixZeroAmountsDialogOpen(false);
      return;
    }
    
    markAsUnpaid.mutate({
      trainerId: selectedTrainerId,
      scheduleIds: selectedScheduleIds,
      resetZeroAmounts: true
    });
    setFixZeroAmountsDialogOpen(false);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end mb-2 gap-2">
        <Button 
          variant="outline" 
          onClick={refreshAllData} 
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
        
        {hasZeroAmountPayments && (
          <Button 
            variant="outline" 
            onClick={() => {
              // Find first trainer with zero-amount payments (excluding trainers with zero commission)
              const trainerWithZero = formattedTrainers.find(t => 
                t.hasZeroAmountPayments && !t.hasZeroCommissionClasses
              );
              if (trainerWithZero) {
                handleFixZeroAmounts(trainerWithZero.id);
              }
            }}
            size="sm"
            className="gap-2 bg-amber-50 border-amber-300 hover:bg-amber-100"
          >
            <Wrench className="h-4 w-4" />
            Fix Zero Amount Payments
          </Button>
        )}
      </div>
      
      <TrainerPaymentsSummary 
        trainers={formattedTrainers}
        isLoading={isLoading}
        dateRange={dateRange}
        branchId={branchId}
        onMarkAsUnpaid={handleMarkAsUnpaid}
        onFixZeroAmounts={handleFixZeroAmounts}
      />
      
      <TrainerPaymentHistory limit={5} showViewAll={true} />
      
      <AlertDialog open={markUnpaidDialogOpen} onOpenChange={setMarkUnpaidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Mark as Unpaid</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this trainer's paid classes as unpaid? 
              This action will revert any payment records and cannot be undone.
              {selectedScheduleIds.length > 0 && (
                <p className="mt-2 font-medium">
                  {selectedScheduleIds.length} class(es) will be marked as unpaid.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (selectedTrainerId) {
                  markAsUnpaid.mutate({ 
                    trainerId: selectedTrainerId, 
                    scheduleIds: selectedScheduleIds
                  });
                }
                setMarkUnpaidDialogOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Mark as Unpaid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={fixZeroAmountsDialogOpen} onOpenChange={setFixZeroAmountsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fix Zero Amount Payments</AlertDialogTitle>
            <AlertDialogDescription>
              Some payment records have incorrect (zero) amounts. This utility will recalculate 
              the correct payment amounts based on the booking data.
              {selectedScheduleIds.length > 0 && (
                <p className="mt-2 font-medium">
                  {selectedScheduleIds.length} payment record(s) will be fixed.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={fixZeroPayments}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Fix Payment Records
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
