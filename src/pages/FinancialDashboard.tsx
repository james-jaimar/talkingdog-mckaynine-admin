
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
import { useInvoices } from "@/hooks/useInvoices";
import { useTerm } from "@/context/TermContext";

export default function FinancialDashboard() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const { currentBranch } = useBranch();
  const { invoices } = useInvoices();
  const { termDateRange } = useTerm();
  
  // Use the existing class financial data hook to get accurate financial information
  const { classFinances, isLoading } = useClassFinancialData(currentBranch?.id);
  
  // Calculate all financial metrics directly from invoices and classFinances
  const calculateFinancials = () => {
    // Filter active invoices (sent, paid, overdue)
    const activeInvoices = invoices.filter(invoice => 
      invoice.status === 'sent' || invoice.status === 'paid' || invoice.status === 'overdue'
    );
    
    // Calculate total revenue from all active invoices
    const totalRevenue = activeInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    
    // Calculate revenue by status
    const collectedRevenue = activeInvoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0);
      
    const pendingRevenue = activeInvoices
      .filter(invoice => invoice.status === 'sent')
      .reduce((sum, invoice) => sum + invoice.total, 0);
      
    const overdueRevenue = activeInvoices
      .filter(invoice => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + invoice.total, 0);
    
    // Calculate total fees from classFinances
    const totalAdmin = classFinances.reduce((sum, item) => sum + item.adminFee, 0);
    const totalTrainer = classFinances.reduce((sum, item) => sum + item.instructorFee, 0);
    const totalFranchise = classFinances.reduce((sum, item) => sum + item.franchiseFee, 0);
    
    // Calculate profit as revenue minus all fees
    const profit = totalRevenue - totalAdmin - totalTrainer - totalFranchise;
    
    return {
      totalRevenue,
      collectedRevenue,
      pendingRevenue,
      overdueRevenue,
      totalAdmin,
      totalTrainer,
      totalFranchise,
      profit
    };
  };
  
  const financialData = calculateFinancials();
  
  // Debug the calculated values
  console.log("Financial Dashboard calculations:", {
    totalRevenue: financialData.totalRevenue,
    collectedRevenue: financialData.collectedRevenue,
    pendingRevenue: financialData.pendingRevenue,
    overdueRevenue: financialData.overdueRevenue,
    totalAdmin: financialData.totalAdmin,
    totalTrainer: financialData.totalTrainer,
    totalFranchise: financialData.totalFranchise,
    profit: financialData.profit,
    invoicesCount: invoices.length,
    activeInvoicesCount: invoices.filter(inv => 
      inv.status === 'sent' || inv.status === 'paid' || inv.status === 'overdue'
    ).length
  });

  // Financial metrics for the metrics cards
  const financialMetrics = {
    totalRevenue: financialData.totalRevenue,
    collectedRevenue: financialData.collectedRevenue,
    pendingRevenue: financialData.pendingRevenue,
    overdueRevenue: financialData.overdueRevenue
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

          {/* Financial metrics cards - now using direct invoice data */}
          <FinancialMetricsCards metrics={financialMetrics} />

          {/* Expense breakdown cards with profit included */}
          <ExpenseBreakdownCards
            totalAdmin={financialData.totalAdmin}
            totalTrainer={financialData.totalTrainer}
            totalFranchise={financialData.totalFranchise}
            profit={financialData.profit}
            totalRevenue={financialData.totalRevenue}
          />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <InvoiceRevenueChart 
              invoices={invoices}
              timeframe={timeframe} 
              termDateRange={termDateRange}
            />
            <RevenueAllocationChart 
              fees={{
                adminFee: financialData.totalAdmin,
                trainerFee: financialData.totalTrainer,
                franchiseFee: financialData.totalFranchise,
                profit: financialData.profit
              }}
              totalRevenue={financialData.totalRevenue}
              showOnlyPaid={true} 
            />
          </div>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
