
import { useState } from "react";
import { useTrainerPayments } from "@/hooks/useTrainerPayments";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TrainerPaymentDialog } from "./TrainerPaymentDialog";
import { TrainerPaymentsTable } from "./TrainerPaymentsTable";

interface TrainerReportsTabProps {
  dateRange: { from: Date; to: Date };
  branchId?: string;
}

export function TrainerReportsTab({ dateRange, branchId }: TrainerReportsTabProps) {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  
  // Pass the dateRange to useTrainerPayments to ensure we get data for the selected date range
  const { data: trainers = [], isLoading, refetch } = useTrainerPayments(branchId, dateRange);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['trainer-payments', branchId, dateRange] });
      await refetch();
      toast.success("Trainer payment data refreshed");
    } catch (error) {
      toast.error("Failed to refresh trainer data");
      console.error(error);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };
  
  const openPaymentDialog = (trainerId: string) => {
    const trainer = trainers.find(t => t.id === trainerId);
    setSelectedTrainerId(trainerId);
    setSelectedScheduleIds(trainer?.scheduleIds || []);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Trainer Financial Report</CardTitle>
          <Button variant="outline" size="sm" disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Trainer Payments</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Data
        </Button>
      </div>
      
      <TrainerPaymentsTable 
        trainers={trainers} 
        onMarkForPayment={openPaymentDialog}
      />
      
      {selectedTrainerId && (
        <TrainerPaymentDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          trainerId={selectedTrainerId} 
          branchId={branchId}
          dateRange={dateRange}
          scheduleIds={selectedScheduleIds}
        />
      )}
    </div>
  );
}
