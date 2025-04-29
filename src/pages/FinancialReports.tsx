
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
  const abortControllerRef = useRef<AbortController | null>(null);
  
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

  // Create new abort controller when component mounts or data params change
  useEffect(() => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller
    abortControllerRef.current = new AbortController();
    
    return () => {
      // Cleanup by aborting any ongoing request when component unmounts or dependencies change
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (err) {
          // Ignore abort errors
          console.log("Ignoring abort error during cleanup");
        }
        abortControllerRef.current = null;
      }
    };
  }, [currentBranch, dateRange]); // Re-create when these dependencies change

  // Initial data load - always fetch fresh data
  useEffect(() => {
    const loadData = async () => {
      if (!currentBranch) return;
      
      setIsLoading(true);
      
      try {
        // Set a loading timeout
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
        
        loadingTimeoutRef.current = setTimeout(() => {
          setIsLoading(false);
        }, 15000); // Force exit loading state after 15 seconds
        
        // Make sure we have a valid abort controller
        if (!abortControllerRef.current) {
          abortControllerRef.current = new AbortController();
        }
        
        const signal = abortControllerRef.current.signal;
        
        // Don't proceed if already aborted
        if (signal.aborted) {
          console.log("Signal already aborted, skipping data fetch");
          return;
        }
        
        // Completely reset all queries to ensure fresh data
        await queryClient.resetQueries({
          queryKey: [
            'financial-bookings', 
            currentBranch.id,
            dateRange.from.toISOString(),
            dateRange.to.toISOString()
          ],
          exact: true
        });
        
        // Also reset trainer payment queries
        await queryClient.resetQueries({
          queryKey: ['trainer-payments'],
          exact: false
        });
        
        // Force fresh fetch for financial data
        await queryClient.fetchQuery({
          queryKey: [
            'financial-bookings', 
            currentBranch.id,
            dateRange.from.toISOString(),
            dateRange.to.toISOString()
          ],
          staleTime: 0, // Always consider data stale
        });
        
        // Also refresh invoice data
        await refreshAllInvoiceQueries();
        
        if (!signal.aborted) {
          setDataInitialized(true);
        }
      } catch (error) {
        // Only log if it's not an abort error
        if (
          !(error instanceof DOMException && error.name === 'AbortError') &&
          error?.name !== 'CancelledError' &&
          !error?.message?.includes?.('cancelled')
        ) {
          console.error("Error initializing financial data:", error);
          toast.error("Failed to load financial data");
        } else {
          console.log("Query cancelled, ignoring error");
        }
      } finally {
        // Only update state if we're still mounted and not cancelled
        if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
          setIsLoading(false);
        }
        
        // Clear loading timeout
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    };
    
    loadData();
    
    // Clean up function to clear timeouts and reset state
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      // Abort any in-flight queries when unmounting
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (err) {
          // Ignore abort errors
          console.log("Ignoring abort error during cleanup");
        }
        abortControllerRef.current = null;
      }
    };
  }, [currentBranch, queryClient, refreshAllInvoiceQueries, dateRange]);

  // Memoized handler for date range changes
  const handleDateRangeChange = useCallback((range: { from: Date; to?: Date }) => {
    // Cancel existing queries before changing date range
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
    }
    
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
    
    // Immediately reset and invalidate all queries for the new date range
    if (currentBranch) {
      // Need to do this in a setTimeout to allow React to update state first
      setTimeout(() => {
        queryClient.resetQueries({
          queryKey: [
            'financial-bookings', 
            currentBranch.id
          ],
          exact: false
        });
      }, 0);
    }
  }, [currentBranch, queryClient]);
  
  // Handle tab changes with debounce
  const handleTabChange = useCallback((value: string) => {
    if (value !== activeTab) {
      // Cancel existing queries before changing tabs
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
      }
      
      setActiveTab(value);
      
      // Force a data refresh when changing tabs
      if (currentBranch) {
        // Reset queries for the current tab
        if (value === 'financial') {
          queryClient.invalidateQueries({
            queryKey: ['financial-bookings'],
            exact: false
          });
        } else if (value === 'trainers') {
          queryClient.invalidateQueries({
            queryKey: ['trainer-payments'],
            exact: false
          });
        }
      }
    }
  }, [activeTab, currentBranch, queryClient]);

  // Reset loading state after date change
  useEffect(() => {
    if (dataInitialized) {
      // Delay to allow queries to execute
      const timer = setTimeout(() => {
        if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
          setIsLoading(false);
        }
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
      
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (err) {
          // Ignore abort errors
          console.log("Ignoring abort error during cleanup");
        }
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Memoized refresh handler - now guaranteed to fetch fresh data
  const refreshFinancialData = useCallback(async (showToast = true) => {
    if (!currentBranch) return;
    
    // Cancel previous requests first
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
    }
    
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
      
      // Also reset trainer payment queries
      await queryClient.resetQueries({
        queryKey: ['trainer-payments'],
        exact: false
      });
      
      // Force fetch with staleTime: 0 to ensure fresh data
      await queryClient.fetchQuery({
        queryKey: [
          'financial-bookings', 
          currentBranch.id,
          dateRange.from.toISOString(),
          dateRange.to.toISOString()
        ],
        staleTime: 0
      });
      
      // Refresh invoice data
      await refreshAllInvoiceQueries();
      
      if (showToast && abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        toast.success("Financial data refreshed");
      }
    } catch (error) {
      // Only show error if it's not an abort error
      if (
        !(error instanceof DOMException && error.name === 'AbortError') &&
        error?.name !== 'CancelledError' &&
        !error?.message?.includes?.('cancelled')
      ) {
        console.error("Error refreshing financial data:", error);
        if (showToast) {
          toast.error("Failed to refresh data");
        }
      } else {
        console.log("Refresh cancelled, ignoring error");
      }
    } finally {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setIsLoading(false);
      }
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
