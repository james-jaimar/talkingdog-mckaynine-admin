
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrainerPaymentData } from "@/hooks/useTrainerPaymentData";
import { TrainerPaymentsSummary } from "./TrainerPaymentsSummary";
import { Loader2, AlertCircle, RefreshCw, Bug } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrainerPaymentHistory } from "./payment-history/TrainerPaymentHistory";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMarkTrainerPaymentsUnpaid } from "@/hooks/useMarkTrainerPaymentsUnpaid";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrainerReportsTabProps {
  dateRange: { from: Date; to: Date };
  branchId?: string;
}

export function TrainerReportsTab({ dateRange, branchId }: TrainerReportsTabProps) {
  const queryClient = useQueryClient();
  const { data: trainersData, isLoading, error, refetch } = useTrainerPaymentData(branchId, dateRange);
  const [markUnpaidDialogOpen, setMarkUnpaidDialogOpen] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  
  const markAsUnpaid = useMarkTrainerPaymentsUnpaid();
  
  const handleMarkAsUnpaid = (trainerId: string) => {
    setSelectedTrainerId(trainerId);
    setMarkUnpaidDialogOpen(true);
  };
  
  const confirmMarkAsUnpaid = async () => {
    if (!selectedTrainerId) return;
    
    const trainer = trainersData?.find(t => t.id === selectedTrainerId);
    if (!trainer) return;
    
    try {
      // Get all paid schedule IDs for this trainer
      const paidScheduleIds = trainer.classDetails
        ?.filter(c => c.isPaid)
        .map(c => c.scheduleId) || [];
      
      if (paidScheduleIds.length === 0) {
        toast.error("No paid classes found for this trainer");
        return;
      }
      
      await markAsUnpaid.mutateAsync({
        trainerId: selectedTrainerId,
        scheduleIds: paidScheduleIds
      });
      
      setMarkUnpaidDialogOpen(false);
    } catch (error) {
      console.error("Error marking as unpaid:", error);
    }
  };
  
  const refreshAllData = () => {
    // Invalidate all payment-related queries
    queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
    queryClient.invalidateQueries({ queryKey: ['trainer-payment-history'] });
    refetch();
    toast.success("Payment data refreshed");
  };

  // Debug function to check trainer payments in database
  const debugTrainerPayments = async () => {
    setIsDebugging(true);
    
    try {
      // Check if trainer_payments table has columns document_url and document_name
      const { data: dbSchema, error: schemaError } = await supabase
        .from('trainer_payments')
        .select('*')
        .limit(1);
        
      if (schemaError) {
        console.error("Error checking trainer_payments schema:", schemaError);
        toast.error("Error checking database schema");
        return;
      }
      
      console.log("Trainer payments schema sample:", dbSchema);
      
      // Fetch recent payments to check status
      const { data: payments, error } = await supabase
        .from('trainer_payments')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error("Error fetching trainer payments:", error);
        toast.error("Error fetching payments from database");
        return;
      }
      
      console.log("Recent trainer payments:", payments);
      toast.success(`Found ${payments.length} trainer payment records`);

      // Refresh data after checking
      refreshAllData();
    } catch (e) {
      console.error("Debug error:", e);
      toast.error("Error during debug");
    } finally {
      setIsDebugging(false);
    }
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
      <div className="flex justify-end mb-2 gap-2">
        <Button 
          variant="outline" 
          onClick={refreshAllData} 
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
        
        {process.env.NODE_ENV === 'development' && (
          <Button 
            variant="outline" 
            onClick={debugTrainerPayments}
            size="sm"
            className="gap-2"
            disabled={isDebugging}
          >
            <Bug className="h-4 w-4" />
            {isDebugging ? "Checking..." : "Debug DB"}
          </Button>
        )}
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
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmMarkAsUnpaid}
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
