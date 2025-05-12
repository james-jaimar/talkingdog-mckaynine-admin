
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBranch } from "@/context/BranchContext";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinancialDashboardContent } from "./FinancialDashboardContent";
import { FinancialDashboardLoading } from "./FinancialDashboardLoading";
import { FinancialDashboardError } from "./FinancialDashboardError";
import { useTerm } from "@/context/TermContext";
import { useInvoices } from "@/hooks/useInvoices";
import { useClassFinancialData } from "@/hooks/useClassFinancialData";

export default function FinancialDashboardPage() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const { currentBranch } = useBranch();
  const { termDateRange, termData } = useTerm();
  const { invoices, isLoading: isLoadingInvoices } = useInvoices();
  const queryClient = useQueryClient();
  
  // Format date range for query params if available
  const fromDate = termDateRange?.startDate ? new Date(termDateRange.startDate).toISOString() : undefined;
  const toDate = termDateRange?.endDate ? new Date(termDateRange.endDate).toISOString() : undefined;
  
  // Use effect to refresh data when term changes
  useEffect(() => {
    if (termData?.id && currentBranch?.id) {
      console.log(`FinancialDashboard: Term data changed to ${termData.term_number}, refreshing financial data for branch ${currentBranch.name}`);
      queryClient.invalidateQueries({ queryKey: ['financial-bookings', currentBranch.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices', currentBranch.id] });
    }
  }, [termData?.id, currentBranch?.id, queryClient]);
  
  // Use the class financial data hook to get accurate financial information for the current term
  const { 
    classFinances, 
    isLoading,
    error,
    branchMismatch,
    refreshData
  } = useClassFinancialData(currentBranch?.id, fromDate, toDate);
  
  // Get all active invoices - filtering to only show relevant statuses AND current branch
  const activeInvoices = currentBranch?.id ? invoices.filter((inv) => {
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
    currentTermNumber: termData?.term_number
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
      refreshData();
      toast.success(`Refreshing financial data for ${currentBranch.name}`);
    }
  };

  if (isLoading || isLoadingInvoices) {
    return <FinancialDashboardLoading />;
  }
  
  if (error) {
    return <FinancialDashboardError onRefresh={handleRefresh} />;
  }
  
  if (branchMismatch) {
    return (
      <RequireAdmin>
        <DashboardLayout>
          <div className="container mx-auto py-6">
            <FinancialDashboardError 
              onRefresh={handleRefresh}
              errorMessage="The financial data contains information from other branches. Please refresh the data to ensure you are seeing data only from the current branch."
            />
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
                Term: {termData?.term_number || 'No term selected'}
              </p>
            </div>
            
            <div className="flex gap-4 items-center">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleRefresh} 
                className="px-3 py-1 flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              
              <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)} className="w-fit">
                <TabsList>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <FinancialDashboardContent 
            financialMetrics={financialMetrics}
            expenseData={expenseData}
            invoices={termFilteredInvoices}
            timeframe={timeframe}
            termDateRange={termDateRange}
          />
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
