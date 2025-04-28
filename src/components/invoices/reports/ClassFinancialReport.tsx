
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { useState } from "react";
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
  
  const fromDate = dateRange?.from?.toISOString();
  const toDate = dateRange?.to?.toISOString();

  const { 
    classFinances, 
    isLoading, 
    refreshData, 
    totalInvoiceCount,
    invalidInvoicesCount,
    totalRevenue: directTotalRevenue
  } = useClassFinancialData(
    currentBranch?.id,
    fromDate,
    toDate
  );

  // Calculate summary statistics
  const classesTotalRevenue = classFinances.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalBookings = classFinances.reduce((sum, item) => sum + item.bookingsCount, 0);
  const totalProfit = classFinances.reduce((sum, item) => sum + item.profit, 0);
  const profitPercentage = directTotalRevenue > 0 ? (totalProfit / directTotalRevenue) * 100 : 0;
  
  // Revenue comparison for debugging
  const revenueDiscrepancy = Math.abs(directTotalRevenue - classesTotalRevenue) > 1;

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // First invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['classes-list-data'] });
      
      // Then refresh the data
      await refreshData();
      
      if (onRefreshSuccess) {
        onRefreshSuccess();
      } else {
        toast.success("Financial data refreshed");
      }
    } catch (error) {
      console.error("Error refreshing financial data:", error);
      toast.error("Failed to refresh financial data");
    } finally {
      // Reset refreshing state
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Class Financial Report</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
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
        
        {revenueDiscrepancy && (
          <Alert>
            <AlertDescription>
              Note: The total revenue from all invoices (R{directTotalRevenue.toFixed(2)}) doesn't match the sum of class revenues 
              (R{classesTotalRevenue.toFixed(2)}). This may be due to rounding differences or other calculation factors.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="overflow-x-auto">
          <ClassFinancialTable 
            classFinances={classFinances} 
            totalRevenue={directTotalRevenue}
            showMismatchWarning={revenueDiscrepancy}
          />
        </div>
      </CardContent>
    </Card>
  );
}
