
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
  const { invoices, isLoading } = useInvoices();
  const { currentBranch } = useBranch();

  // Filter out any cancelled invoices and include only sent or paid invoices for revenue calculations
  const activeInvoices = invoices ? invoices.filter(invoice => 
    invoice.status !== 'cancelled' && (invoice.status === 'sent' || invoice.status === 'paid' || invoice.status === 'overdue')
  ) : [];
  
  // Filter out only paid invoices for fee calculations
  const paidInvoices = activeInvoices.filter(invoice => invoice.status === 'paid');
  const totalPaidRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  
  // Calculate financial metrics from filtered invoice data
  const financialMetrics = {
    totalRevenue: activeInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
    collectedRevenue: paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
    pendingRevenue: activeInvoices.filter(invoice => invoice.status === 'sent')
      .reduce((sum, invoice) => sum + invoice.total, 0),
    overdueRevenue: activeInvoices.filter(invoice => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + invoice.total, 0)
  };

  // Calculate fees using correct percentages of the actual paid revenue
  const totalAdmin = totalPaidRevenue * 0.10; // 10% admin fee
  const totalHandler = totalPaidRevenue * 0.40; // 40% handler fee
  const totalFranchise = totalPaidRevenue * 0.15; // 15% franchise fee

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

          {/* Expense breakdown cards with correct fee names */}
          <ExpenseBreakdownCards
            totalAdmin={totalAdmin}
            totalTrainer={totalHandler} // This is actually the Handler Fee
            totalFranchise={totalFranchise}
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
