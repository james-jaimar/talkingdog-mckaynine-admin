
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
import { FinancialDataProvider } from "@/context/FinancialDataContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { toast } from "sonner";

function FinancialDashboardContent() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const { currentBranch } = useBranch();
  const { termDateRange } = useTerm();
  const { invoices } = useInvoices();
  
  // Get all active invoices
  const activeInvoices = invoices.filter(inv => 
    inv.status === 'sent' || inv.status === 'paid' || inv.status === 'overdue'
  );
  
  // Calculate revenue metrics directly from invoices
  const totalRevenue = activeInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const collectedRevenue = activeInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);
  const pendingRevenue = activeInvoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.total, 0);
  const overdueRevenue = activeInvoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0);
  
  // Use the class financial data hook to get accurate financial information
  const { 
    classFinances, 
    isLoading, 
    totalRevenue: hookTotalRevenue,
    refreshData
  } = useClassFinancialData(currentBranch?.id, termDateRange?.startDate, termDateRange?.endDate);
  
  // Calculate all financial metrics from class finances
  const totalAdmin = classFinances.reduce((sum, item) => sum + item.adminFee, 0);
  const totalTrainer = classFinances.reduce((sum, item) => sum + item.instructorFee, 0);
  const totalFranchise = classFinances.reduce((sum, item) => sum + item.franchiseFee, 0);
  
  // Calculate profit as revenue minus all fees
  const profit = totalRevenue - totalAdmin - totalTrainer - totalFranchise;

  // Force refresh data when component mounts or when term or branch changes
  useEffect(() => {
    if (currentBranch?.id && termDateRange) {
      refreshData();
      console.log("Forcing financial data refresh due to branch/term change");
    }
  }, [currentBranch?.id, termDateRange, refreshData]);
  
  // Debug the calculated values
  useEffect(() => {
    console.log("Financial Dashboard calculations:", {
      totalRevenue,
      collectedRevenue,
      pendingRevenue,
      overdueRevenue,
      totalAdmin,
      totalTrainer,
      totalFranchise,
      profit,
      invoicesCount: activeInvoices.length,
      hookTotalRevenue,
      classFinancesCount: classFinances.length
    });

    // Add warning toast if class finances is empty
    if (classFinances.length === 0 && !isLoading && currentBranch) {
      toast.warning("No financial data found for the current term and branch", {
        description: "Please check if classes have been set up with fee information",
        duration: 5000
      });
    }
  }, [totalRevenue, totalAdmin, totalTrainer, totalFranchise, profit, activeInvoices.length, hookTotalRevenue, classFinances.length, isLoading, currentBranch]);

  // Financial metrics for the metrics cards
  const financialMetrics = {
    totalRevenue,
    collectedRevenue,
    pendingRevenue,
    overdueRevenue
  };

  // Expense breakdown data
  const expenseData = {
    totalAdmin,
    totalTrainer,
    totalFranchise,
    profit,
    totalRevenue
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Financial Dashboard</h1>
        
        <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)} className="w-fit">
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="w-full py-12 text-center">
          <p className="text-lg text-muted-foreground">Loading financial data...</p>
        </div>
      ) : (
        <>
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
              invoices={activeInvoices}
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
        </>
      )}

      {/* Debug button for administrators to refresh data */}
      <div className="mt-6 text-right">
        <button 
          onClick={() => {
            refreshData();
            toast.success("Financial data is being refreshed");
          }}
          className="text-xs text-muted-foreground hover:text-primary underline"
        >
          Refresh Financial Data
        </button>
      </div>
    </div>
  );
}

export default function FinancialDashboard() {
  return (
    <RequireAdmin>
      <DashboardLayout>
        <Helmet>
          <title>Financial Dashboard - McKaynine Training Centre</title>
        </Helmet>
        
        <ErrorBoundary>
          <FinancialDataProvider>
            <FinancialDashboardContent />
          </FinancialDataProvider>
        </ErrorBoundary>
      </DashboardLayout>
    </RequireAdmin>
  );
}
