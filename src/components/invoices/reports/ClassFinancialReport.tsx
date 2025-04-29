
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useBranch } from "@/context/BranchContext";
import { useClassFinancialData } from "@/hooks/useClassFinancialData";
import { ClassFinancialTable } from "./ClassFinancialTable";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ClassFinancialReportProps {
  dateRange?: { from: Date; to: Date };
  onRefreshSuccess?: () => void;
}

export function ClassFinancialReport({ dateRange, onRefreshSuccess }: ClassFinancialReportProps) {
  const { currentBranch } = useBranch();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);
  const maxRefreshAttempts = 3;
  
  const fromDate = dateRange?.from?.toISOString();
  const toDate = dateRange?.to?.toISOString();

  // Get financial data with the current parameters
  const { 
    classFinances, 
    isLoading, 
    refreshData, 
    totalInvoiceCount,
    invalidInvoicesCount,
    totalRevenue: directTotalRevenue,
    totalDiscounts
  } = useClassFinancialData(
    currentBranch?.id,
    fromDate,
    toDate
  );
  
  // Always reset cache on mount to ensure fresh data
  useEffect(() => {
    if (currentBranch?.id) {
      queryClient.resetQueries({ 
        queryKey: [
          'financial-bookings', 
          currentBranch.id,
          fromDate,
          toDate
        ],
        exact: true
      });
    }
  }, [currentBranch?.id, fromDate, toDate, queryClient]);
  
  // Safety mechanism to exit loading state after a timeout
  useEffect(() => {
    if (isLoading && !refreshing) {
      timeoutRef.current = setTimeout(() => {
        if (attemptCountRef.current < maxRefreshAttempts) {
          attemptCountRef.current += 1;
          console.log(`Still loading after timeout, attempt ${attemptCountRef.current} of ${maxRefreshAttempts}`);
          
          // Try refreshing data again
          refreshData().catch(console.error);
        } else {
          console.error("Maximum refresh attempts reached, data may be stale");
          toast.error("Unable to load fresh data after multiple attempts");
        }
      }, 10000); // 10 seconds timeout
    } else {
      // Clear the timeout when loading completes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Reset attempt counter when loading completes successfully
      if (!isLoading && attemptCountRef.current > 0) {
        attemptCountRef.current = 0;
      }
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, refreshing, refreshData]);

  // Calculate summary statistics
  const classesTotalRevenue = classFinances.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalBookings = classFinances.reduce((sum, item) => sum + item.bookingsCount, 0);
  const totalProfit = classFinances.reduce((sum, item) => sum + item.profit, 0);
  const profitPercentage = directTotalRevenue > 0 ? (totalProfit / directTotalRevenue) * 100 : 0;
  
  // Check for discrepancy between total invoice revenue and calculated class revenues
  const revenueDiscrepancy = Math.abs(directTotalRevenue - classesTotalRevenue) > 1;
  const discrepancyAmount = directTotalRevenue - classesTotalRevenue;

  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    attemptCountRef.current = 0;
    
    try {
      // First reset all queries to clear caches completely
      await queryClient.resetQueries({ 
        queryKey: ['financial-bookings', currentBranch?.id, fromDate, toDate],
        exact: true 
      });
      
      await queryClient.resetQueries({ 
        queryKey: ['invoices'],
        exact: false
      });
      
      await queryClient.resetQueries({
        queryKey: ['trainer-payments'],
        exact: false
      });
      
      // Force fetch with zero staleTime
      await queryClient.fetchQuery({
        queryKey: ['financial-bookings', currentBranch?.id, fromDate, toDate],
        queryFn: async () => {
          const result = await refreshData();
          return result;
        },
        staleTime: 0
      });
      
      // Then refresh the data
      await refreshData();
      
      // Notify of success
      if (onRefreshSuccess) {
        onRefreshSuccess();
      } else {
        toast.success("Financial data refreshed");
      }
    } catch (error) {
      console.error("Error refreshing financial data:", error);
      toast.error("Failed to refresh financial data");
    } finally {
      // Reset refreshing state after a short delay for UX
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (isLoading || refreshing) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Class Financial Report</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={true}
          >
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-36">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!classFinances || classFinances.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Class Financial Report</CardTitle>
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
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground py-4">No financial data available for the selected date range</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Class Financial Report</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {totalInvoiceCount} invoices | {totalBookings} bookings | 
            Profit margin: {profitPercentage.toFixed(1)}%
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {invalidInvoicesCount > 0 && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Found {invalidInvoicesCount} invalid or problematic {invalidInvoicesCount === 1 ? 'invoice' : 'invoices'} 
              that {invalidInvoicesCount === 1 ? 'has' : 'have'} been excluded from calculations.
              These are invoices without items or with other issues.
            </AlertDescription>
          </Alert>
        )}
        
        {totalDiscounts > 0 && (
          <Alert>
            <AlertDescription>
              Total discounts of {totalDiscounts.toFixed(2)} have been applied to invoices and proportionally 
              distributed across classes. The revenue shown is net after discounts.
            </AlertDescription>
          </Alert>
        )}
        
        {revenueDiscrepancy && (
          <Alert>
            <AlertDescription>
              Note: There's a discrepancy of {discrepancyAmount > 0 ? '+' : '-'}{Math.abs(discrepancyAmount).toFixed(2)} 
              between the total revenue from invoices (R{directTotalRevenue.toFixed(2)}) 
              and the sum of class revenues (R{classesTotalRevenue.toFixed(2)}).
              This may be due to rounding or unallocated items.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="overflow-x-auto">
          <ClassFinancialTable 
            classFinances={classFinances} 
            totalRevenue={directTotalRevenue}
            showMismatchWarning={revenueDiscrepancy}
            totalDiscounts={totalDiscounts}
          />
        </div>
      </CardContent>
    </Card>
  );
}
