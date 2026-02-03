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
import { MonthSelector } from "./MonthSelector";
import { startOfMonth, endOfMonth } from "date-fns";

interface ClassFinancialReportProps {
  onRefreshSuccess?: () => void;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];

export function ClassFinancialReport({ onRefreshSuccess }: ClassFinancialReportProps) {
  const { currentBranch } = useBranch();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  
  // Internal month/year state
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Compute dateRange internally
  const dateRange = {
    from: startOfMonth(new Date(selectedYear, selectedMonth - 1)),
    to: endOfMonth(new Date(selectedYear, selectedMonth - 1))
  };
  
  const fromDate = dateRange.from.toISOString();
  const toDate = dateRange.to.toISOString();
  
  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  const { 
    classFinances, 
    isLoading, 
    refreshData, 
    totalInvoiceCount,
    invalidInvoicesCount,
    totalRevenue: directTotalRevenue,
    courseFeeRevenue,
    enrollmentFeeRevenue
  } = useClassFinancialData(
    currentBranch?.id,
    fromDate,
    toDate
  );

  // Calculate summary statistics
  const classesTotalRevenue = classFinances.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalBookings = classFinances.reduce((sum, item) => sum + item.bookingsCount, 0);
  const totalProfit = classFinances.reduce((sum, item) => sum + item.profit, 0);
  const profitPercentage = courseFeeRevenue > 0 ? (totalProfit / courseFeeRevenue) * 100 : 0;
  
  // Check for discrepancy between course fee revenue and calculated class revenues
  // A small discrepancy (< R10) is acceptable due to rounding
  const discrepancyAmount = courseFeeRevenue - classesTotalRevenue;
  const unexplainedDiscrepancy = Math.abs(discrepancyAmount) > 10 ? discrepancyAmount : 0;

  // Log the relationship between bookings and invoices for debugging
  console.log("ClassFinancialReport - total bookings:", totalBookings);
  console.log("ClassFinancialReport - total invoices:", totalInvoiceCount);

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
          <CardTitle>Class Financial Report - {monthLabel}</CardTitle>
          <div className="flex items-center gap-2">
            <MonthSelector
              month={selectedMonth}
              year={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
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
        <CardContent className="text-center">
          <p className="text-muted-foreground py-4">No financial data available for {monthLabel}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Class Financial Report - {monthLabel}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {totalInvoiceCount} invoices | {totalBookings} bookings | 
            Profit margin: {profitPercentage.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            Revenue and fees calculated on course fees only (excludes enrollment fees)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthSelector
            month={selectedMonth}
            year={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
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
        
        {enrollmentFeeRevenue > 0 && (
          <Alert>
            <AlertDescription className="flex items-center gap-2">
              <span className="font-medium">Enrollment Fees:</span>
              <span>R{enrollmentFeeRevenue.toFixed(2)} collected (pass-through to franchise owner, not included in class revenue calculations)</span>
            </AlertDescription>
          </Alert>
        )}
        
        {unexplainedDiscrepancy !== 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unexplained discrepancy of R{Math.abs(unexplainedDiscrepancy).toFixed(2)} 
              between course fee total (R{courseFeeRevenue.toFixed(2)}) 
              and sum of class revenues (R{classesTotalRevenue.toFixed(2)}).
              This may be due to unallocated items or data issues.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="overflow-x-auto">
          <ClassFinancialTable 
            classFinances={classFinances} 
            totalRevenue={courseFeeRevenue}
            enrollmentFeeRevenue={enrollmentFeeRevenue}
            showMismatchWarning={unexplainedDiscrepancy !== 0}
          />
        </div>
      </CardContent>
    </Card>
  );
}
