
import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useBranch } from "@/context/BranchContext";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { ClassFinancialReport } from "@/components/invoices/reports/ClassFinancialReport";
import { ClassesListReport } from "@/components/invoices/reports/ClassesListReport";
import { DateRangePicker } from "@/components/dashboard/financial/DateRangePicker";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrainerReportsTab } from "@/components/invoices/reports/TrainerReportsTab";
import { Loader2 } from "lucide-react";
import { FinancialDataProvider } from "@/context/FinancialDataContext";
import { useFinancialData } from "@/context/FinancialDataContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

function FinancialReportsContent() {
  // Set default date range to current month
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 0)), // Current month
    to: endOfMonth(new Date())
  });
  
  const { currentBranch } = useBranch();
  const { isLoading, fetchFinancialData } = useFinancialData();
  
  // Default to 'financial' tab
  const [activeTab, setActiveTab] = useState('financial');
  const [initialized, setInitialized] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    if (currentBranch?.id) {
      const fromDateIso = dateRange.from.toISOString();
      const toDateIso = dateRange.to.toISOString();
      fetchFinancialData(currentBranch.id, fromDateIso, toDateIso);
      setInitialized(true);
    }
  }, [currentBranch, fetchFinancialData]);

  // Memoized handler for date range changes
  const handleDateRangeChange = useCallback((range: { from: Date; to?: Date }) => {
    const newRange = {
      from: range.from,
      to: range.to || endOfMonth(new Date())
    };
    
    setDateRange(newRange);
    
    if (currentBranch?.id) {
      const fromDateIso = newRange.from.toISOString();
      const toDateIso = newRange.to.toISOString();
      fetchFinancialData(currentBranch.id, fromDateIso, toDateIso);
    }
  }, [currentBranch, fetchFinancialData]);
  
  // Handle tab changes
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <DateRangePicker 
          dateRange={dateRange} 
          onDateRangeChange={handleDateRangeChange}
          isLoading={isLoading}
          disabled={isLoading}
        />
      </div>

      {isLoading && !initialized && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <p className="text-lg">Loading financial data...</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="financial">Financial Report</TabsTrigger>
          <TabsTrigger value="classes">Classes List</TabsTrigger>
          <TabsTrigger value="trainers">Trainers</TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          <div className="space-y-6">
            <ClassFinancialReport dateRange={dateRange} />
          </div>
        </TabsContent>

        <TabsContent value="classes">
          <ClassesListReport />
        </TabsContent>
        
        <TabsContent value="trainers">
          <TrainerReportsTab 
            dateRange={dateRange}
            branchId={currentBranch?.id}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function FinancialReports() {
  return (
    <RequireAdmin>
      <DashboardLayout>
        <Helmet>
          <title>Financial Reports - McKaynine Training Centre</title>
        </Helmet>
        
        <div className="container mx-auto py-6">
          <ErrorBoundary>
            <FinancialDataProvider>
              <FinancialReportsContent />
            </FinancialDataProvider>
          </ErrorBoundary>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
