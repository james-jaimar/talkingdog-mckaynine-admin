
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { InvoiceRevenueChart } from "@/components/invoices/reports/InvoiceRevenueChart";
import { RevenueAllocationChart } from "@/components/invoices/reports/RevenueAllocationChart";
import { useInvoices } from "@/hooks/useInvoices";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBranch } from "@/context/BranchContext";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { FinancialMetricsCards } from "@/components/dashboard/financial/FinancialMetricsCards";
import { ExpenseBreakdownCards } from "@/components/dashboard/financial/ExpenseBreakdownCards";

export default function FinancialDashboard() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const { invoices } = useInvoices();
  const { currentBranch } = useBranch();

  // Filter out cancelled invoices and include only sent or paid invoices for revenue calculations
  const activeInvoices = invoices ? invoices.filter(invoice => 
    invoice.status !== 'cancelled' && (invoice.status === 'sent' || invoice.status === 'paid' || invoice.status === 'overdue')
  ) : [];
  
  // Filter out only paid invoices for fee calculations to ensure accuracy
  const paidInvoices = activeInvoices.filter(invoice => invoice.status === 'paid');
  
  // Calculate financial metrics from filtered invoice data
  const financialMetrics = {
    totalRevenue: activeInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
    collectedRevenue: paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
    pendingRevenue: activeInvoices.filter(invoice => invoice.status === 'sent')
      .reduce((sum, invoice) => sum + invoice.total, 0),
    overdueRevenue: activeInvoices.filter(invoice => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + invoice.total, 0)
  };

  // Calculate fees based on actual invoice values
  const totalAdmin = paidInvoices.reduce((sum, inv) => {
    const adminFee = inv.admin_fee || 0;
    return sum + adminFee;
  }, 0);

  const totalTrainer = paidInvoices.reduce((sum, inv) => {
    const trainerFee = inv.trainer_fee || 0;
    return sum + trainerFee;
  }, 0);

  const totalFranchise = paidInvoices.reduce((sum, inv) => {
    const franchiseFee = inv.franchise_fee || 0;
    return sum + franchiseFee;
  }, 0);

  // Calculate profit from actual collected revenue minus all fees
  const totalFees = totalAdmin + totalTrainer + totalFranchise;
  const profit = financialMetrics.collectedRevenue - totalFees;

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
          <FinancialMetricsCards metrics={financialMetrics} />

          {/* Expense breakdown cards with profit included */}
          <ExpenseBreakdownCards
            totalAdmin={totalAdmin}
            totalTrainer={totalTrainer}
            totalFranchise={totalFranchise}
            profit={profit}
            totalRevenue={financialMetrics.collectedRevenue}
          />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <InvoiceRevenueChart invoices={activeInvoices} timeframe={timeframe} />
            <RevenueAllocationChart invoices={activeInvoices} showOnlyPaid />
          </div>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
