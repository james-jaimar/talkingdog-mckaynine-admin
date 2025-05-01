
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

export default function FinancialDashboard() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const { currentBranch } = useBranch();
  const { termDateRange, termData } = useTerm();
  const { invoices } = useInvoices();
  const queryClient = useQueryClient();
  
  // Use effect to refresh data when term changes
  useEffect(() => {
    if (termData?.id) {
      console.log(`FinancialDashboard: Term data changed, refreshing financial data for term ${termData.term_number}`);
      queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  }, [termData?.id, queryClient]);
  
  // Get all active invoices
  const activeInvoices = invoices.filter(inv => 
    inv.status === 'sent' || inv.status === 'paid' || inv.status === 'overdue'
  );
  
  // Filter invoices by term date range if available
  const termFilteredInvoices = termDateRange 
    ? activeInvoices.filter(inv => {
        const invDate = new Date(inv.issued_date);
        const startDate = new Date(termDateRange.startDate);
        const endDate = new Date(termDateRange.endDate);
        return invDate >= startDate && invDate <= endDate;
      })
    : activeInvoices;
  
  // Calculate revenue metrics directly from invoices
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
    totalRevenue: hookTotalRevenue
  } = useClassFinancialData(currentBranch?.id, fromDate, toDate);
  
  // Calculate all financial metrics from class finances
  const totalAdmin = classFinances.reduce((sum, item) => sum + item.adminFee, 0);
  const totalTrainer = classFinances.reduce((sum, item) => sum + item.instructorFee, 0);
  const totalFranchise = classFinances.reduce((sum, item) => sum + item.franchiseFee, 0);
  
  // Calculate profit as revenue minus all fees
  const profit = totalRevenue - totalAdmin - totalTrainer - totalFranchise;
  
  // Debug the calculated values
  console.log("Financial Dashboard calculations:", {
    totalRevenue,
    collectedRevenue,
    pendingRevenue,
    overdueRevenue,
    totalAdmin,
    totalTrainer,
    totalFranchise,
    profit,
    invoicesCount: termFilteredInvoices.length,
    hookTotalRevenue,
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

  // Expense breakdown data
  const expenseData = {
    totalAdmin,
    totalTrainer,
    totalFranchise,
    profit,
    totalRevenue
  };

  return (
    <RequireAdmin>
      <DashboardLayout>
        <Helmet>
          <title>Financial Dashboard - McKaynine Training Centre</title>
        </Helmet>
        
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
