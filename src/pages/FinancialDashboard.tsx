
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { InvoiceRevenueChart } from "@/components/invoices/reports/InvoiceRevenueChart";
import { RevenueAllocationChart } from "@/components/invoices/reports/RevenueAllocationChart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBranch } from "@/context/BranchContext";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { FinancialMetricsCards } from "@/components/dashboard/financial/FinancialMetricsCards";
import { ExpenseBreakdownCards } from "@/components/dashboard/financial/ExpenseBreakdownCards";
import { useClassFinancialData } from "@/hooks/useClassFinancialData";
import { useTerm } from "@/context/TermContext";
import { useInvoices } from "@/hooks/useInvoices";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Invoice } from "@/hooks/invoices/types";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FinancialDashboard() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const { currentBranch } = useBranch();
  const { termDateRange, termData } = useTerm();
  const { invoices, isLoading: isLoadingInvoices } = useInvoices();
  const queryClient = useQueryClient();
  const [branchMismatch, setBranchMismatch] = useState(false);
  
  // Use effect to refresh data when term changes
  useEffect(() => {
    if (termData?.id && currentBranch?.id) {
      console.log(`FinancialDashboard: Term data changed to ${termData.termNumber}, refreshing financial data for branch ${currentBranch.name}`);
      queryClient.invalidateQueries({ queryKey: ['financial-bookings', currentBranch.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices', currentBranch.id] });
    }
  }, [termData?.id, currentBranch?.id, queryClient]);
  
  // Get all active invoices - filtering to only show relevant statuses AND current branch
  const activeInvoices = currentBranch?.id ? invoices.filter((inv: Invoice) => {
    // Check if invoice has client data with branch_id
    const branchMatch = inv.client?.branch_id === currentBranch?.id;
    const statusMatch = inv.status === 'sent' || inv.status === 'paid' || inv.status === 'overdue';
    
    if (!branchMatch && statusMatch && inv.client) {
      console.warn(`Invoice ${inv.invoice_number} has mismatched branch. Invoice client branch: ${inv.client?.branch_id}, Current branch: ${currentBranch?.id}`);
    }
    
    return branchMatch && statusMatch;
  }) : [];
  
  // Filter invoices by term date range if available
  const termFilteredInvoices = termDateRange 
    ? activeInvoices.filter(inv => {
        const invDate = new Date(inv.issued_date);
        const startDate = new Date(termDateRange.startDate);
        const endDate = new Date(termDateRange.endDate);
        return invDate >= startDate && invDate <= endDate;
      })
    : activeInvoices;
  
  // Log branch filtering information
  useEffect(() => {
    if (currentBranch?.id) {
      console.log(`FinancialDashboard: Current branch is ${currentBranch.name} (${currentBranch.id})`);
      console.log(`Total invoices: ${invoices.length}, filtered for branch: ${activeInvoices.length}, filtered for term: ${termFilteredInvoices.length}`);
    }
  }, [currentBranch?.id, invoices.length, activeInvoices.length, termFilteredInvoices.length]);
  
  // Calculate revenue metrics directly from invoices using total (already includes discounts)
  const totalRevenue = termFilteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const collectedRevenue = termFilteredInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);
  const pendingRevenue = termFilteredInvoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.total, 0);
  const overdueRevenue = termFilteredInvoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0);
  
  // Format date range for query params if available
  const fromDate = termDateRange?.startDate ? new Date(termDateRange.startDate).toISOString() : undefined;
  const toDate = termDateRange?.endDate ? new Date(termDateRange.endDate).toISOString() : undefined;
  
  // Use the class financial data hook to get accurate financial information for the current term
  const { 
    classFinances, 
    isLoading,
    error
  } = useClassFinancialData(currentBranch?.id, fromDate, toDate);
  
  // Verify that all class finances are from the correct branch
  useEffect(() => {
    if (currentBranch?.id && classFinances.length > 0) {
      // Check if the financial data indicates mismatched branch
      const mismatch = classFinances.some(c => 
        c.branch_id && c.branch_id !== currentBranch.id
      );
      
      if (mismatch) {
        console.error(`Found financial data for incorrect branch. Current branch: ${currentBranch.id}, but some data belongs to other branches.`);
        setBranchMismatch(true);
      } else {
        setBranchMismatch(false);
      }
    }
  }, [classFinances, currentBranch?.id]);
  
  // Calculate all financial metrics from class finances - using the NET revenue in all calculations
  const totalAdmin = classFinances.reduce((sum, item) => sum + item.adminFee, 0);
  const totalTrainer = classFinances.reduce((sum, item) => sum + item.instructorFee, 0);
  const totalFranchise = classFinances.reduce((sum, item) => sum + item.franchiseFee, 0);
  
  // Calculate profit as NET revenue minus all fees
  const profit = totalRevenue - totalAdmin - totalTrainer - totalFranchise;
  
  // Debug the calculated values with branch ID for verification
  console.log("Financial Dashboard calculations:", {
    branchId: currentBranch?.id,
    branchName: currentBranch?.name,
    totalRevenue,
    collectedRevenue,
    pendingRevenue,
    overdueRevenue,
    totalAdmin,
    totalTrainer,
    totalFranchise,
    profit,
    invoicesCount: termFilteredInvoices.length,
    termDateRange,
    currentTermNumber: termData?.termNumber
  });

  // Financial metrics for the metrics cards
  const financialMetrics = {
    totalRevenue,
    collectedRevenue,
    pendingRevenue,
    overdueRevenue
  };

  // Expense breakdown data - all based on NET revenue
  const expenseData = {
    totalAdmin,
    totalTrainer,
    totalFranchise,
    profit,
    totalRevenue
  };

  // Handle refresh button click
  const handleRefresh = () => {
    if (currentBranch?.id) {
      queryClient.invalidateQueries({ queryKey: ['financial-bookings', currentBranch.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices', currentBranch.id] });
      queryClient.removeQueries({ queryKey: ['financial-bookings'] }); // Remove any old queries without branch ID
      toast.success(`Refreshing financial data for ${currentBranch.name}`);
    }
  };

  if (isLoading || isLoadingInvoices) {
    return (
      <RequireAdmin>
        <DashboardLayout>
          <div className="container mx-auto py-6 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg">Loading financial data...</p>
          </div>
        </DashboardLayout>
      </RequireAdmin>
    );
  }
  
  if (error) {
    return (
      <RequireAdmin>
        <DashboardLayout>
          <div className="container mx-auto py-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error loading financial data. Please try again or contact support.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <button 
                onClick={handleRefresh} 
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Retry Loading Data
              </button>
            </div>
          </div>
        </DashboardLayout>
      </RequireAdmin>
    );
  }
  
  if (branchMismatch) {
    return (
      <RequireAdmin>
        <DashboardLayout>
          <div className="container mx-auto py-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The financial data contains information from other branches. 
                Please refresh the data to ensure you are seeing data only from {currentBranch?.name}.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <button 
                onClick={handleRefresh} 
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Refresh Financial Data
              </button>
            </div>
          </div>
        </DashboardLayout>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <DashboardLayout>
        <Helmet>
          <title>Financial Dashboard - McKaynine Training Centre</title>
        </Helmet>
        
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Financial Dashboard</h1>
              <p className="text-muted-foreground">
                Branch: {currentBranch?.name || 'No branch selected'} |
                Term: {termData?.termNumber || 'No term selected'}
              </p>
            </div>
            
            <div className="flex gap-4 items-center">
              <button 
                onClick={handleRefresh} 
                className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
              >
                Refresh
              </button>
              
              <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)} className="w-fit">
                <TabsList>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Financial metrics cards */}
          <FinancialMetricsCards 
            totalRevenue={totalRevenue}
            collectedRevenue={collectedRevenue}
            pendingRevenue={pendingRevenue}
            overdueRevenue={overdueRevenue}
          />

          {/* Expense breakdown cards with profit included */}
          <ExpenseBreakdownCards {...expenseData} />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <InvoiceRevenueChart 
              invoices={termFilteredInvoices}
              timeframe={timeframe} 
              termDateRange={termDateRange}
            />
            <RevenueAllocationChart 
              fees={{
                adminFee: totalAdmin,
                trainerFee: totalTrainer,
                franchiseFee: totalFranchise,
                profit: profit
              }}
              totalRevenue={totalRevenue}
              showOnlyPaid={false} // Show all revenue for allocation
            />
          </div>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
