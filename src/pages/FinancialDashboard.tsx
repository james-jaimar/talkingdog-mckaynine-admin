
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

  // Calculate fees by going through invoice items
  let totalAdmin = 0;
  let totalTrainer = 0;
  let totalFranchise = 0;

  // Process each paid invoice
  paidInvoices.forEach(invoice => {
    if (!invoice.items || invoice.items.length === 0) {
      console.warn('Invoice has no items:', invoice.id);
      return;
    }
    
    // Go through each item with a booking to calculate fees based on class configuration
    invoice.items.forEach(item => {
      // Get the amount for this item
      const amount = item.amount || 0;
      
      if (item.bookings && item.bookings.class_schedules && item.bookings.class_schedules.classes) {
        const classInfo = item.bookings.class_schedules.classes;
        
        // Calculate admin fee
        if (classInfo.admin_fee_type === 'percentage') {
          totalAdmin += amount * ((classInfo.admin_fee_value || 0) / 100);
        } else {
          totalAdmin += (classInfo.admin_fee_value || 0);
        }
        
        // Calculate trainer fee
        if (classInfo.trainer_fee_type === 'percentage') {
          totalTrainer += amount * ((classInfo.trainer_fee_value || 0) / 100);
        } else {
          totalTrainer += (classInfo.trainer_fee_value || 0);
        }
        
        // Calculate franchise fee
        if (classInfo.mckaynine_commission_type === 'percentage') {
          totalFranchise += amount * ((classInfo.mckaynine_commission_value || 0) / 100);
        } else {
          totalFranchise += (classInfo.mckaynine_commission_value || 0);
        }
      } else {
        // For items without bookings, use default fee structure
        // Apply a default fee structure for custom invoice items
        totalAdmin += amount * 0.10; // Default 10% for admin
        totalTrainer += amount * 0.40; // Default 40% for trainer
        totalFranchise += amount * 0.15; // Default 15% for franchise
      }
    });
  });

  // Ensure we have no negative values
  totalAdmin = Math.max(0, totalAdmin);
  totalTrainer = Math.max(0, totalTrainer);
  totalFranchise = Math.max(0, totalFranchise);
  
  // Calculate profit from actual collected revenue minus all fees
  const totalFees = totalAdmin + totalTrainer + totalFranchise;
  const profit = financialMetrics.collectedRevenue - totalFees;

  // Debug the calculated values
  console.log("Financial calculations:", {
    totalAdmin,
    totalTrainer,
    totalFranchise,
    profit,
    collectedRevenue: financialMetrics.collectedRevenue
  });

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
