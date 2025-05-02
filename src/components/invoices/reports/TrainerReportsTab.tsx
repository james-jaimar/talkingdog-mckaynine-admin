
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
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showPermissionsCheck, setShowPermissionsCheck] = useState(false);
  const [permissionCheckResult, setPermissionCheckResult] = useState<any>(null);
  
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
    // Invalidate all payment-related queries with a force refetch
    queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
    queryClient.invalidateQueries({ queryKey: ['trainer-payment-history'] });
    refetch();
    toast.success("Payment data refreshed");
  };

  // Test edge function for trainer payments
  const testEdgeFunction = async () => {
    try {
      setIsDebugging(true);
      
      const testTrainerId = trainersData && trainersData.length > 0 
        ? trainersData[0].id 
        : '00000000-0000-0000-0000-000000000000';
      
      // Test the edge function with minimal data
      const { data, error } = await supabase.functions.invoke('update-trainer-payments', {
        body: { 
          trainerId: testTrainerId,
          scheduleIds: ['00000000-0000-0000-0000-000000000000'], // Test ID
          paymentMethod: 'bank_transfer',
          notes: 'Test from debugging panel'
        }
      });
      
      setPermissionCheckResult({
        success: !error,
        error: error?.message,
        data
      });
      
      if (error) {
        toast.error("Edge function test failed", { 
          description: error.message
        });
      } else {
        toast.success("Edge function is working", {
          description: "The payment update edge function is properly configured"
        });
      }
    } catch (e) {
      console.error("Error testing edge function:", e);
      setPermissionCheckResult({
        success: false,
        error: e.message
      });
      toast.error("Edge function test failed", {
        description: e.message
      });
    } finally {
      setIsDebugging(false);
    }
  };

  // Debug function to check trainer payments in database
  const debugTrainerPayments = async () => {
    setIsDebugging(true);
    setDebugInfo(null);
    
    try {
      // Check if trainer_payments table structure
      const { data: dbSchema, error: schemaError } = await supabase
        .from("trainer_payments")
        .select("*")
        .limit(1);
        
      if (schemaError) {
        console.error("Error checking trainer_payments schema:", schemaError);
        toast.error("Error checking database schema");
        return;
      }
      
      console.log("Trainer payments schema sample:", dbSchema);
      
      // Test direct insert to verify permission issues
      const testData = {
        trainer_id: '00000000-0000-0000-0000-000000000000', // Just a placeholder for testing
        class_schedule_id: '00000000-0000-0000-0000-000000000000', // Just a placeholder
        status: 'test',
        amount: 0,
        updated_at: new Date().toISOString()
      };
      
      const { data: insertTest, error: insertError } = await supabase
        .from("trainer_payments")
        .insert([testData])
        .select();
        
      // Check if we can update an existing record - less intrusive than insert test
      const { data: payments, error } = await supabase
        .from("trainer_payments")
        .select("*")
        .order('updated_at', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error("Error fetching trainer payments:", error);
        toast.error("Error fetching payments from database");
        return;
      }

      const debugResults = {
        schema: dbSchema ? Object.keys(dbSchema[0] || {}) : [],
        insertTest: {
          success: !insertError,
          error: insertError?.message,
        },
        recentPayments: payments,
        tableCounts: await getTableCounts()
      };
      
      setDebugInfo(debugResults);
      console.log("Debug results:", debugResults);
      
      if (payments && payments.length > 0) {
        toast.success(`Found ${payments.length} trainer payment records`);
      } else {
        toast.warning("No payment records found in database");
      }

      // Refresh data after debugging
      refreshAllData();
    } catch (e) {
      console.error("Debug error:", e);
      toast.error("Error during debug");
    } finally {
      setIsDebugging(false);
    }
  };
  
  // Helper function to get counts from various tables
  const getTableCounts = async () => {
    const tables = ['trainer_payments', 'invoices', 'trainers', 'bookings'];
    const counts: Record<string, number> = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table as any)
          .select('*', { count: 'exact', head: true });
          
        counts[table] = count || 0;
        
        if (error) {
          console.error(`Error counting ${table}:`, error);
        }
      } catch (e) {
        console.error(`Error in count for ${table}:`, e);
      }
    }
    
    return counts;
  };

  // Check for database schema issues on mount
  useEffect(() => {
    const checkDbSchema = async () => {
      try {
        // Check if document_url column exists using edge function
        const response = await supabase.functions.invoke('check-column-exists', {
          body: {
            table: 'trainer_payments',
            column: 'document_url'
          }
        });
        
        if (response.error) {
          console.warn("Could not check schema:", response.error);
        } else if (!response.data?.exists) {
          console.warn("Missing document_url column in trainer_payments table");
        }
      } catch (e) {
        console.error("Schema check error:", e);
      }
    };
    
    checkDbSchema();
  }, []);

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
          onClick={() => setShowPermissionsCheck(true)} 
          size="sm"
          className="gap-2"
        >
          <Info className="h-4 w-4" />
          Check Permissions
        </Button>
        
        <Button 
          variant="outline" 
          onClick={debugTrainerPayments}
          size="sm"
          className="gap-2"
          disabled={isDebugging}
        >
          <Database className="h-4 w-4" />
          {isDebugging ? "Checking..." : "Verify Database"}
        </Button>
      </div>
      
      {showPermissionsCheck && (
        <Alert variant="default" className="bg-blue-50 mb-4">
          <AlertTitle className="flex items-center gap-2">
            Permission Check
            <Button 
              variant="outline" 
              size="sm"
              onClick={testEdgeFunction}
              disabled={isDebugging}
            >
              {isDebugging ? "Testing..." : "Test Edge Function"}
            </Button>
          </AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Testing payment permissions can help identify issues with trainer payments.
            </p>
            {permissionCheckResult && (
              <div className="text-xs font-mono overflow-x-auto mt-2 p-2 bg-slate-100 rounded">
                <p><strong>Success:</strong> {permissionCheckResult.success ? '✅ Yes' : '❌ No'}</p>
                {permissionCheckResult.error && <p><strong>Error:</strong> {permissionCheckResult.error}</p>}
                {permissionCheckResult.data && (
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(permissionCheckResult.data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {debugInfo && (
        <Alert variant="default" className="bg-slate-50 mb-4">
          <div className="text-xs font-mono overflow-x-auto">
            <p className="font-semibold mb-1">Database Tables:</p>
            {Object.entries(debugInfo.tableCounts || {}).map(([table, count]) => (
              <div key={table} className="flex justify-between">
                <span>{table}:</span>
                <span className="font-semibold">{String(count)} records</span>
              </div>
            ))}
            <p className="font-semibold mt-2 mb-1">Payment Columns:</p>
            <p>{debugInfo.schema?.join(', ')}</p>
            {debugInfo.insertTest && (
              <div className="mt-2">
                <p className="font-semibold">Insert Test:</p>
                <p>Success: {debugInfo.insertTest.success ? '✅ Yes' : '❌ No'}</p>
                {debugInfo.insertTest.error && <p className="text-red-500">Error: {debugInfo.insertTest.error}</p>}
              </div>
            )}
          </div>
        </Alert>
      )}
      
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
