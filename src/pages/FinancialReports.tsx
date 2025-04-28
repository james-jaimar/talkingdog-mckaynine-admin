
import { useState, useEffect, useRef, useCallback } from "react";
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
import { Loader2 } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [dataInitialized, setDataInitialized] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initial data load with smart cache management
  useEffect(() => {
    const loadData = async () => {
      if (currentBranch) {
        setIsLoading(true);
        
        try {
          // Set a loading timeout
          loadingTimeoutRef.current = setTimeout(() => {
            setIsLoading(false);
          }, 15000); // Force exit loading state after 15 seconds
          
          // Prepare query keys with date parameters
          const queryKey = [
            'financial-bookings', 
            currentBranch.id,
            dateRange.from.toISOString(),
            dateRange.to.toISOString()
          ];
          
          // Reset queries for this specific query key only
          await queryClient.resetQueries({ 
            queryKey, 
            exact: true 
          });
          
          // Force fresh fetch for financial data
          await queryClient.fetchQuery({
            queryKey,
            staleTime: 30000, // 30 seconds
          });
          
          // Also refresh invoice data
          await refreshAllInvoiceQueries();
          
          setDataInitialized(true);
        } catch (error) {
          console.error("Error initializing financial data:", error);
          toast.error("Failed to load financial data");
        } finally {
          setIsLoading(false);
          
          // Clear loading timeout
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
        }
      }
    };
    
    loadData();
    
    // Clean up function to clear timeouts and reset state
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [currentBranch, queryClient, refreshAllInvoiceQueries]);

  // Memoized handler for date range changes
  const handleDateRangeChange = useCallback((range: { from: Date; to?: Date }) => {
    setDateRange({
      from: range.from,
      to: range.to || endOfMonth(new Date())
    });
    
    // Set loading state and clear after timeout
    setIsLoading(true);
    
    // Set a timeout to clear loading state in case it gets stuck
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // Force exit loading state after 10 seconds
  }, []);
  
  // Handle tab changes with debounce
  const handleTabChange = useCallback((value: string) => {
    if (value !== activeTab) {
      setActiveTab(value);
    }
  }, [activeTab]);

  // Reset loading state after date change
  useEffect(() => {
    if (dataInitialized) {
      // Delay to allow queries to execute
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [dateRange, dataInitialized]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Memoized refresh handler
  const refreshFinancialData = useCallback(async (showToast = true) => {
    if (!currentBranch) return;
    
    setIsLoading(true);
    
    try {
      // Reset queries for the current date range
      await queryClient.resetQueries({ 
        queryKey: [
          'financial-bookings', 
          currentBranch.id,
          dateRange.from.toISOString(),
          dateRange.to.toISOString()
        ],
        exact: true 
      });
      
      // Refresh invoice data
      await refreshAllInvoiceQueries();
      
      if (showToast) {
        toast.success("Financial data refreshed");
      }
    } catch (error) {
      console.error("Error refreshing financial data:", error);
      if (showToast) {
        toast.error("Failed to refresh data");
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentBranch, dateRange, queryClient, refreshAllInvoiceQueries]);

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
              isLoading={isLoading}
              disabled={isLoading}
            />
          </div>

          {isLoading && !dataInitialized && (
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
