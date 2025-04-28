import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function FinancialDashboard() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const { currentBranch } = useBranch();
  const { termDateRange } = useTerm();
  const { invoices } = useInvoices();
  const navigate = useNavigate();
  
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
    unallocatedDetails
  } = useClassFinancialData(currentBranch?.id);
  
  // Calculate all financial metrics from class finances
  const totalAdmin = classFinances.reduce((sum, item) => sum + item.adminFee, 0);
  const totalTrainer = classFinances.reduce((sum, item) => sum + item.instructorFee, 0);
  const totalFranchise = classFinances.reduce((sum, item) => sum + item.franchiseFee, 0);
  
  // Calculate profit as revenue minus all fees
  const profit = totalRevenue - totalAdmin - totalTrainer - totalFranchise;

  // Calculate unallocated statistics
  const unallocatedItems = classFinances.filter(item => 
    item.sourceType === 'unallocated' || item.className === 'Unallocated Revenue'
  );
  const unallocatedRevenue = unallocatedItems.reduce((sum, item) => sum + item.totalRevenue, 0);
  const unallocatedPercentage = totalRevenue > 0 ? (unallocatedRevenue / totalRevenue) * 100 : 0;
  
  // Count unallocated invoices
  const unallocatedInvoicesCount = unallocatedDetails?.length || 0;
  
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
    invoicesCount: activeInvoices.length,
    hookTotalRevenue,
    unallocatedRevenue,
    unallocatedPercentage,
    unallocatedInvoicesCount
  });

  // Financial metrics for the metrics cards
  const financialMetrics = {
    totalRevenue,
    collectedRevenue,
    pendingRevenue,
    overdueRevenue,
    unallocatedRevenue,
    unallocatedPercentage
  };

  // Expense breakdown data
  const expenseData = {
    totalAdmin,
    totalTrainer,
    totalFranchise,
    profit,
    totalRevenue
  };
  
  // Check for a significant discrepancy between the total revenue sources
  const revenueDiscrepancy = Math.abs(totalRevenue - hookTotalRevenue) > 1;
  const hasUnallocatedRevenue = unallocatedRevenue > 0 && unallocatedPercentage > 5; // Show alert if more than 5%

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

          {revenueDiscrepancy && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                There might be a small discrepancy in financial calculations due to invoices without booking associations.
                For the most accurate data, please refer to the Financial Reports page.
              </AlertDescription>
            </Alert>
          )}
          
          {hasUnallocatedRevenue && (
            <Alert className="mb-6" variant="warning">
              <Info className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Approximately {unallocatedPercentage.toFixed(1)}% of your revenue (R{unallocatedRevenue.toFixed(2)}) 
                  comes from {unallocatedInvoicesCount} invoices that aren't linked to specific classes.
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/financial-reports?tab=unallocated')}
                >
                  View Unallocated Invoices
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Financial metrics cards */}
          <FinancialMetricsCards 
            totalRevenue={totalRevenue}
            collectedRevenue={collectedRevenue}
            pendingRevenue={pendingRevenue}
            overdueRevenue={overdueRevenue}
            unallocatedRevenue={unallocatedRevenue}
            unallocatedPercentage={unallocatedPercentage}
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
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
