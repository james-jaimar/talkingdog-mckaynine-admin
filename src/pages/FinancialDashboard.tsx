
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { InvoiceRevenueChart } from "@/components/invoices/reports/InvoiceRevenueChart";
import { RevenueAllocationChart } from "@/components/invoices/reports/RevenueAllocationChart";
import { TrainerPaymentsSummary } from "@/components/invoices/reports/TrainerPaymentsSummary";
import { useInvoices } from "@/hooks/useInvoices";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBranch } from "@/context/BranchContext";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { FinancialMetricsCards } from "@/components/dashboard/financial/FinancialMetricsCards";
import { useTrainerPayments } from "@/hooks/useTrainerPayments";

export default function FinancialDashboard() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const { invoices, isLoading } = useInvoices();
  const { currentBranch } = useBranch();
  const { data: trainers = [], isLoading: isTrainersLoading } = useTrainerPayments(currentBranch?.id);

  // Calculate financial metrics from actual invoice data
  // Ensure we're properly separating and accounting for each status type
  const financialMetrics = {
    totalRevenue: invoices ? invoices.reduce((sum, invoice) => sum + invoice.total, 0) : 0,
    collectedRevenue: invoices ? invoices.filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0) : 0,
    pendingRevenue: invoices ? invoices.filter(invoice => invoice.status === 'sent')
      .reduce((sum, invoice) => sum + invoice.total, 0) : 0,
    overdueRevenue: invoices ? invoices.filter(invoice => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + invoice.total, 0) : 0
  };

  // Log any discrepancies for debugging
  const sumOfComponents = financialMetrics.collectedRevenue + 
                          financialMetrics.pendingRevenue + 
                          financialMetrics.overdueRevenue;
                          
  if (Math.abs(financialMetrics.totalRevenue - sumOfComponents) > 0.01) {
    console.warn(
      `Warning: Dashboard metrics don't add up. ` +
      `Total: ${financialMetrics.totalRevenue}, Sum of components: ${sumOfComponents}, ` +
      `Difference: ${financialMetrics.totalRevenue - sumOfComponents}`
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

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <InvoiceRevenueChart invoices={invoices} timeframe={timeframe} />
            <RevenueAllocationChart invoices={invoices} />
          </div>

          {/* Trainer payments summary */}
          <div className="mb-6">
            <TrainerPaymentsSummary trainers={trainers} isLoading={isTrainersLoading} />
          </div>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
