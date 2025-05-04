
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useInvoices } from "@/hooks/useInvoices";
import { useBranch } from "@/context/BranchContext";
import { useQueryClient } from "@tanstack/react-query";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { ClassFinancialReport } from "@/components/invoices/reports/ClassFinancialReport";
import { ClassesListReport } from "@/components/invoices/reports/ClassesListReport";
import { DateRangePicker } from "@/components/dashboard/financial/DateRangePicker";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TrainerReportsTab } from "@/components/invoices/reports/TrainerReportsTab";
import { useClassFinancialData } from "@/hooks/useClassFinancialData";
import { useTerm } from "@/context/TermContext";

export default function FinancialReports() {
  const queryClient = useQueryClient();
  const { termDateRange, termData } = useTerm();
  
  // Set default date range based on current term if available, otherwise current month
  const [dateRange, setDateRange] = useState({
    from: termDateRange ? new Date(termDateRange.startDate) : startOfMonth(subMonths(new Date(), 0)),
    to: termDateRange ? new Date(termDateRange.endDate) : endOfMonth(new Date())
  });
  
  // Update date range when term changes
  useEffect(() => {
    if (termDateRange) {
      console.log("FinancialReports: Term date range changed, updating date range");
      setDateRange({
        from: new Date(termDateRange.startDate),
        to: new Date(termDateRange.endDate)
      });
    }
  }, [termDateRange]);
  
  const { currentBranch } = useBranch();
  const { invoices, isLoading, refreshAllInvoiceQueries } = useInvoices();
  
  // Default to 'financial' tab
  const [activeTab, setActiveTab] = useState('financial');

  // Refresh data when component mounts, branch changes or date range changes
  useEffect(() => {
    if (currentBranch) {
      console.log("Financial Reports: Branch or date range changed, refreshing data");
      refreshFinancialData();
    }
  }, [currentBranch, dateRange]);
  
  // Also refresh when term changes
  useEffect(() => {
    if (termData?.id) {
      console.log(`FinancialReports: Term changed to ${termData.term_number}, refreshing data`);
      refreshFinancialData();
    }
  }, [termData?.id]);

  // Function to refresh all financial data with more aggressive cache invalidation
  const refreshFinancialData = () => {
    // Invalidate all relevant queries first
    queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['classes-list-data'] });
    queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    
    // Then refresh invoice data
    refreshAllInvoiceQueries();
    
    toast.success("Financial data refreshed");
  };

  // Handle date range changes
  const handleDateRangeChange = (range: { from: Date; to?: Date }) => {
    setDateRange({
      from: range.from,
      to: range.to || endOfMonth(new Date())
    });
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <RequireAdmin>
      <DashboardLayout>
        <Helmet>
          <title>Financial Reports - McKaynine Training Centre</title>
        </Helmet>
        
        <div className="container mx-auto py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">Financial Reports</h1>
            <DateRangePicker 
              dateRange={dateRange} 
              onDateRangeChange={handleDateRangeChange} 
            />
          </div>
          
          {/* Debug info - display term and date range */}
          <div className="mb-4 text-sm text-muted-foreground">
            <p>
              Current term: {termData?.term_number || 'None'} | 
              Date range: {dateRange.from.toLocaleDateString()} to {dateRange.to.toLocaleDateString()}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="financial">Financial Report</TabsTrigger>
              <TabsTrigger value="classes">Classes List</TabsTrigger>
              <TabsTrigger value="trainers">Trainers</TabsTrigger>
            </TabsList>

            <TabsContent value="financial">
              <div className="space-y-6">
                <ClassFinancialReport 
                  dateRange={dateRange} 
                  onRefreshSuccess={() => {
                    refreshAllInvoiceQueries();
                    toast.success("Financial data refreshed");
                  }} 
                />
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
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
