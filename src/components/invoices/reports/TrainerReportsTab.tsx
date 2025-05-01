
import { useState, useEffect } from "react";
import { useTrainerPayments } from "@/hooks/useTrainerPayments";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TrainerPaymentDialog } from "./TrainerPaymentDialog";
import { TrainerPaymentsTable } from "./TrainerPaymentsTable";
import { TrainerPaymentHistory } from "./payment-history/TrainerPaymentHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] = useState<'payments' | 'history'>('payments');
  
  // Pass the dateRange to useTrainerPayments to ensure we get data for the selected date range
  const { data: trainers = [], isLoading, refetch } = useTrainerPayments(branchId, dateRange);
  
  // Effect to run when dateRange or branchId changes
  useEffect(() => {
    console.log("TrainerReportsTab: Date range or branch changed - invalidating queries");
    queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
  }, [dateRange, branchId, queryClient]);
  
  const handleRefresh = async () => {
    console.log("TrainerReportsTab: Manually refreshing trainer payment data");
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
      await queryClient.invalidateQueries({ queryKey: ['trainer-payments-history'] });
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
    console.log("Opening payment dialog for trainer ID:", trainerId);
    const trainer = trainers.find(t => t.id === trainerId);
    console.log("Selected trainer:", trainer);
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

  console.log("TrainerReportsTab: Rendering with trainers:", trainers);
  console.log("TrainerReportsTab: Date range:", dateRange);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'payments' | 'history')} className="w-full">
          <div className="flex justify-between items-center mb-2">
            <TabsList>
              <TabsTrigger value="payments">Pending Payments</TabsTrigger>
              <TabsTrigger value="history">Payment History</TabsTrigger>
            </TabsList>
            
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
          
          <TabsContent value="payments">
            <TrainerPaymentsTable 
              trainers={trainers} 
              onMarkForPayment={openPaymentDialog}
            />
          </TabsContent>
          
          <TabsContent value="history">
            <TrainerPaymentHistory />
          </TabsContent>
        </Tabs>
      </div>
      
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
