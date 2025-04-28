
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
  const { refreshAllInvoiceQueries } = useInvoices();
  
  // Default to 'financial' tab
  const [activeTab, setActiveTab] = useState('financial');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Initial data load with forced refresh
  useEffect(() => {
    const loadData = async () => {
      if (currentBranch) {
        // Always do a complete refresh when component is mounted
        await queryClient.resetQueries({ queryKey: ['financial-bookings'] });
        await queryClient.resetQueries({ queryKey: ['invoices'] });
        
        // Force a full refresh of all financial data
        await refreshAllInvoiceQueries();
        
        // Then refresh financial-bookings queries specifically
        await queryClient.refetchQueries({ 
          queryKey: ['financial-bookings'],
          type: 'all'
        });
        
        setIsInitialLoad(false);
      }
    };
    
    loadData();
    
    // Clean up function to reset stale flags
    return () => {
      queryClient.setQueryDefaults(['financial-bookings'], {
        staleTime: 5000 // Reset to default stale time when component unmounts
      });
    };
  }, [currentBranch, queryClient, refreshAllInvoiceQueries]);

  // Force refresh when date range changes
  useEffect(() => {
    if (!isInitialLoad && currentBranch && dateRange.from && dateRange.to) {
      const refreshOnDateChange = async () => {
        // Reset queries with the old date range
        await queryClient.resetQueries({ queryKey: ['financial-bookings'] });
      
        // Then force a refresh with the new date range
        await refreshFinancialData(false);
      };
      
      refreshOnDateChange();
    }
  }, [dateRange, currentBranch, isInitialLoad, queryClient]);

  // Function to refresh all financial data
  const refreshFinancialData = async (showToast = true) => {
    if (!currentBranch) return;
    
    try {
      // Completely reset the cache for these queries
      await queryClient.resetQueries({ queryKey: ['financial-bookings'] });
      await queryClient.resetQueries({ queryKey: ['invoices'] });
      
      // Ensure invoices are refreshed
      await refreshAllInvoiceQueries();
      
      // Force refetch of financial data with the current parameters
      await queryClient.refetchQueries({ 
        queryKey: ['financial-bookings', currentBranch.id, 
                  dateRange.from.toISOString(), 
                  dateRange.to.toISOString()],
        type: 'all'
      });
      
      if (showToast) {
        toast.success("Financial data refreshed");
      }
    } catch (error) {
      console.error("Error refreshing financial data:", error);
      if (showToast) {
        toast.error("Failed to refresh data");
      }
    }
  };

  // Handle date range changes
  const handleDateRangeChange = (range: { from: Date; to?: Date }) => {
    setDateRange({
      from: range.from,
      to: range.to || endOfMonth(new Date())
    });
  };
  
  const handleTabChange = (value: string) => {
    if (value !== activeTab) {
      setActiveTab(value);
      
      // Refresh data when changing tabs
      refreshFinancialData(false);
    }
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
                  onRefreshSuccess={() => refreshFinancialData()}
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
