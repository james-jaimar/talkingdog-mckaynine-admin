
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

export default function FinancialDashboard() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const { currentBranch } = useBranch();
  
  // Use the existing class financial data hook to get accurate financial information
  const { classFinances, isLoading } = useClassFinancialData(currentBranch?.id);
  
  // Calculate total revenue from the collected/paid invoices
  const totalRevenue = classFinances.reduce((sum, item) => sum + item.totalRevenue, 0);
  
  // Calculate financial metrics
  const financialMetrics = {
    totalRevenue: totalRevenue,
    collectedRevenue: totalRevenue, // For simplicity, using collected revenue as our basis
    pendingRevenue: 0, // We could calculate this if needed
    overdueRevenue: 0  // We could calculate this if needed
  };

  // Calculate fees by summing from all class finances
  let totalAdmin = classFinances.reduce((sum, item) => sum + item.adminFee, 0);
  let totalTrainer = classFinances.reduce((sum, item) => sum + item.instructorFee, 0);
  let totalFranchise = classFinances.reduce((sum, item) => sum + item.franchiseFee, 0);
  
  // Calculate profit as revenue minus all fees
  const profit = totalRevenue - totalAdmin - totalTrainer - totalFranchise;
  
  // Debug the calculated values
  console.log("Financial Dashboard calculations:", {
    totalAdmin,
    totalTrainer,
    totalFranchise,
    profit,
    totalRevenue,
    classFinances
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
            totalRevenue={totalRevenue}
          />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <InvoiceRevenueChart 
              invoices={[]} // We'll handle this in the component
              timeframe={timeframe} 
            />
            <RevenueAllocationChart 
              fees={{
                adminFee: totalAdmin,
                trainerFee: totalTrainer,
                franchiseFee: totalFranchise,
                profit: profit
              }}
              totalRevenue={totalRevenue}
              showOnlyPaid={true} 
            />
          </div>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
