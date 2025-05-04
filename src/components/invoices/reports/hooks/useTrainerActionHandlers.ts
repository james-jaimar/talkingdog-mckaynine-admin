
import { useState } from "react";
import { useMarkTrainerPaymentsUnpaid } from "@/hooks/useMarkTrainerPaymentsUnpaid";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { TrainerPaymentData } from "@/hooks/trainer-payments/types";

export function useTrainerActionHandlers() {
  const queryClient = useQueryClient();
  const [markUnpaidDialogOpen, setMarkUnpaidDialogOpen] = useState(false);
  const [fixZeroAmountsDialogOpen, setFixZeroAmountsDialogOpen] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const markAsUnpaid = useMarkTrainerPaymentsUnpaid();
  
  const handleMarkAsUnpaid = (trainerId: string, trainersData?: TrainerPaymentData[]) => {
    setSelectedTrainerId(trainerId);
    // Find trainer data to get all scheduleIds
    const trainer = trainersData?.find(t => t.id === trainerId);
    // Find paid schedules for this trainer
    const paidSchedules = trainer?.classDetails.filter(c => c.isPaid).map(c => c.scheduleId) || [];
    setSelectedScheduleIds(paidSchedules);
    setMarkUnpaidDialogOpen(true);
  };

  const handleFixZeroAmounts = (trainerId: string, trainersData?: TrainerPaymentData[]) => {
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
  
  const findFirstTrainerWithZeroAmounts = (trainersData?: TrainerPaymentData[]) => {
    if (!trainersData) return null;
    
    // Find first trainer with zero-amount payments (excluding trainers with zero commission)
    return trainersData.find(t => 
      t.classDetails.some(cls => cls.hasZeroAmountPayment && !cls.hasZeroCommission)
    );
  };

  const refreshAllData = () => {
    queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
    queryClient.invalidateQueries({ queryKey: ['trainer-payment-history'] });
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
    
    setIsProcessing(true);
    
    markAsUnpaid.mutate({
      trainerId: selectedTrainerId,
      scheduleIds: selectedScheduleIds,
      resetZeroAmounts: true
    }, {
      onSettled: () => {
        setIsProcessing(false);
        setFixZeroAmountsDialogOpen(false);
      }
    });
  };

  // Handle confirmation of marking as unpaid
  const confirmMarkAsUnpaid = () => {
    if (!selectedTrainerId) return;
    
    setIsProcessing(true);
    
    markAsUnpaid.mutate(
      { 
        trainerId: selectedTrainerId, 
        scheduleIds: selectedScheduleIds
      },
      {
        onSettled: () => {
          setIsProcessing(false);
          setMarkUnpaidDialogOpen(false);
        }
      }
    );
  };
  
  return {
    markUnpaidDialogOpen,
    setMarkUnpaidDialogOpen,
    fixZeroAmountsDialogOpen, 
    setFixZeroAmountsDialogOpen,
    selectedTrainerId,
    selectedScheduleIds,
    isProcessing,
    handleMarkAsUnpaid,
    handleFixZeroAmounts,
    findFirstTrainerWithZeroAmounts,
    refreshAllData,
    fixZeroPayments,
    confirmMarkAsUnpaid
  };
}
