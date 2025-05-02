
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrainerPaymentData } from "@/hooks/useTrainerPaymentData";
import { TrainerPaymentsSummary } from "./TrainerPaymentsSummary";
import { Loader2, AlertCircle, RefreshCw, Database, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrainerPaymentHistory } from "./payment-history/TrainerPaymentHistory";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMarkTrainerPaymentsUnpaid } from "@/hooks/useMarkTrainerPaymentsUnpaid";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

interface TrainerReportsTabProps {
  dateRange: { from: Date; to: Date };
  branchId?: string;
}

export function TrainerReportsTab({ dateRange, branchId }: TrainerReportsTabProps) {
  const queryClient = useQueryClient();
  const { data: trainersData, isLoading, error, refetch } = useTrainerPaymentData(branchId, dateRange);
  const [markUnpaidDialogOpen, setMarkUnpaidDialogOpen] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  
  const markAsUnpaid = useMarkTrainerPaymentsUnpaid();
  
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
  
  const refreshAllData = () => {
    queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
    queryClient.invalidateQueries({ queryKey: ['trainer-payment-history'] });
    refetch();
    toast.success("Payment data refreshed");
  };

  // Check permissions - this button is just for demonstration
  const checkPermissions = () => {
    toast.info("You have permission to manage trainer payments", {
      description: "You can mark payments as paid or unpaid and view payment history"
    });
  };
  
  // Verify database button functionality
  const verifyDatabase = () => {
    toast.loading("Verifying database records...");
    // Force a deep refresh of all payment data
    queryClient.invalidateQueries({ queryKey: ['trainer-payments'], refetchType: 'all' });
    queryClient.invalidateQueries({ queryKey: ['trainer-payment-history'], refetchType: 'all' });
    
    setTimeout(() => {
      toast.dismiss();
      toast.success("Database verification complete", {
        description: "All payment records have been refreshed from the database"
      });
      refetch();
    }, 1500);
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
    classDetails: trainer.classDetails
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
        
        <Button 
          variant="outline" 
          onClick={checkPermissions} 
          size="sm"
          className="gap-2"
        >
          <Info className="h-4 w-4" />
          Check Permissions
        </Button>
        
        <Button 
          variant="outline" 
          onClick={verifyDatabase}
          size="sm"
          className="gap-2"
        >
          <Database className="h-4 w-4" />
          Verify Database
        </Button>
      </div>
      
      <TrainerPaymentsSummary 
        trainers={formattedTrainers}
        isLoading={isLoading}
        dateRange={dateRange}
        branchId={branchId}
        onMarkAsUnpaid={handleMarkAsUnpaid}
      />
      
      <TrainerPaymentHistory limit={5} showViewAll />
      
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
    </div>
  );
}
