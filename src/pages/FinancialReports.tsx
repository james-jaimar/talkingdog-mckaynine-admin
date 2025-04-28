
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

export default function FinancialReports() {
  const queryClient = useQueryClient();
  
  // Set default date range to current month
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 0)), // Current month
    to: endOfMonth(new Date())
  });
  
  const { currentBranch } = useBranch();
  const { invoices, isLoading, refreshAllInvoiceQueries } = useInvoices();
  
  // Default to 'financial' tab
  const [activeTab, setActiveTab] = useState('financial');

  // Clear all caches on first render to ensure fresh data
  useEffect(() => {
    const clearAllCaches = async () => {
      console.log("FinancialReports: Initial mount - clearing all caches");
      
      // Invalidate all queries to clear stale data
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
      
      // Reset queries to clear cache completely
      await queryClient.resetQueries({ queryKey: ['financial-bookings'] });
      await queryClient.resetQueries({ queryKey: ['classes-list-data'] });
      await queryClient.resetQueries({ queryKey: ['trainer-payments'] });
      
      // Force a refresh after clearing cache
      await refreshFinancialData();
    };
    
    clearAllCaches();
  }, []); 

  // Refresh data when component mounts, branch changes or date range changes
  useEffect(() => {
    if (currentBranch) {
      console.log("Financial Reports: Branch or date range changed, refreshing data");
      refreshFinancialData();
    }
  }, [currentBranch, dateRange]);

  // Function to refresh all financial data
  const refreshFinancialData = async () => {
    // Invalidate all relevant queries first
    await queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
    await queryClient.invalidateQueries({ queryKey: ['classes-list-data'] });
    await queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
    
    // Reset queries to clear cache
    await queryClient.resetQueries({ 
      queryKey: ['financial-bookings', currentBranch?.id],
      exact: false
    });
    
    // Then refresh invoice data
    await refreshAllInvoiceQueries();
    
    // Immediately refetch to get fresh data
    await queryClient.refetchQueries({ 
      queryKey: ['financial-bookings'],
      type: 'all'
    });
    
    toast.success("Financial data refreshed");
  };

  // Handle date range changes
  const handleDateRangeChange = (range: { from: Date; to?: Date }) => {
    // Clear cache when date range changes
    queryClient.removeQueries({ 
      queryKey: ['financial-bookings', currentBranch?.id],
      exact: false
    });
    
    setDateRange({
      from: range.from,
      to: range.to || endOfMonth(new Date())
    });
  };
  
  const handleTabChange = (value: string) => {
    // Clear cache when switching tabs
    queryClient.invalidateQueries({ 
      queryKey: ['financial-bookings'],
      exact: false
    });
    
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
                    queryClient.refetchQueries({ queryKey: ['invoices'] });
                    queryClient.refetchQueries({ queryKey: ['financial-bookings'] });
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
