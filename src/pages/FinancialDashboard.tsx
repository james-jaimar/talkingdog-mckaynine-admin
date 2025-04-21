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
import { startOfMonth, endOfMonth } from "date-fns";
import { ExpenseBreakdownCards } from "@/components/dashboard/financial/ExpenseBreakdownCards";

export default function FinancialDashboard() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const { invoices, isLoading } = useInvoices();
  const { currentBranch } = useBranch();
  
  // Set up a default date range for the trainer payments (current month)
  const currentDateRange = {
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  };
  
  const { data: trainers = [], isLoading: isTrainersLoading } = useTrainerPayments(currentBranch?.id, currentDateRange);

  // Filter out any cancelled invoices and include only sent or paid invoices for revenue calculations
  const activeInvoices = invoices ? invoices.filter(invoice => 
    invoice.status !== 'cancelled' && (invoice.status === 'sent' || invoice.status === 'paid' || invoice.status === 'overdue')
  ) : [];
  
  // Calculate financial metrics from filtered invoice data
  const financialMetrics = {
    // Only count active invoices (sent, paid, overdue) in total revenue
    totalRevenue: activeInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
    
    // Only paid invoices count as collected revenue
    collectedRevenue: activeInvoices.filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0),
    
    // Only sent invoices count as pending revenue
    pendingRevenue: activeInvoices.filter(invoice => invoice.status === 'sent')
      .reduce((sum, invoice) => sum + invoice.total, 0),
    
    // Only overdue invoices count as overdue revenue
    overdueRevenue: activeInvoices.filter(invoice => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + invoice.total, 0)
  };

  // Calculate total fees for all active invoices
  const totalAdmin = activeInvoices.reduce((sum, inv) => sum + (inv.admin_fee || 0), 0);
  const totalTrainer = activeInvoices.reduce((sum, inv) => sum + (inv.trainer_fee || 0), 0);
  const totalFranchise = activeInvoices.reduce((sum, inv) => sum + (inv.franchise_fee || 0), 0);

  // Log detailed breakdown of invoices for debugging
  console.log("Active invoices count:", activeInvoices.length);
  console.log("Paid invoices count:", activeInvoices.filter(invoice => invoice.status === 'paid').length);
  console.log("Sent invoices count:", activeInvoices.filter(invoice => invoice.status === 'sent').length);
  console.log("Overdue invoices count:", activeInvoices.filter(invoice => invoice.status === 'overdue').length);
  
  // Validate that components match total
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

          {/* Financial metrics cards - pass the filtered active invoices */}
          <FinancialMetricsCards metrics={financialMetrics} />

          {/* New: Expense breakdown cards */}
          <ExpenseBreakdownCards
            totalAdmin={totalAdmin}
            totalTrainer={totalTrainer}
            totalFranchise={totalFranchise}
            totalRevenue={financialMetrics.totalRevenue}
          />

          {/* Charts - pass the filtered active invoices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <InvoiceRevenueChart invoices={activeInvoices} timeframe={timeframe} />
            <RevenueAllocationChart invoices={activeInvoices} />
          </div>

          {/* Trainer payments summary */}
          <div className="mb-6">
            <TrainerPaymentsSummary 
              trainers={trainers} 
              isLoading={isTrainersLoading} 
              dateRange={currentDateRange}
              branchId={currentBranch?.id}
            />
          </div>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
