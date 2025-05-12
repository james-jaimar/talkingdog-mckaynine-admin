
import { InvoiceRevenueChart } from "@/components/invoices/reports/InvoiceRevenueChart";
import { RevenueAllocationChart } from "@/components/invoices/reports/RevenueAllocationChart";
import { FinancialMetricsCards } from "@/components/dashboard/financial/FinancialMetricsCards";
import { ExpenseBreakdownCards } from "@/components/dashboard/financial/ExpenseBreakdownCards";
import { Invoice } from "@/hooks/invoices/types";

interface FinancialDashboardContentProps {
  financialMetrics: {
    totalRevenue: number;
    collectedRevenue: number;
    pendingRevenue: number;
    overdueRevenue: number;
  };
  expenseData: {
    totalAdmin: number;
    totalTrainer: number;
    totalFranchise: number;
    profit: number;
    totalRevenue: number;
  };
  invoices: Invoice[];
  timeframe: 'monthly' | 'quarterly' | 'yearly';
  termDateRange?: {
    startDate: string;
    endDate: string;
  };
}

export function FinancialDashboardContent({
  financialMetrics,
  expenseData,
  invoices,
  timeframe,
  termDateRange
}: FinancialDashboardContentProps) {
  return (
    <>
      {/* Financial metrics cards */}
      <FinancialMetricsCards 
        totalRevenue={financialMetrics.totalRevenue}
        collectedRevenue={financialMetrics.collectedRevenue}
        pendingRevenue={financialMetrics.pendingRevenue}
        overdueRevenue={financialMetrics.overdueRevenue}
      />

      {/* Expense breakdown cards with profit included */}
      <ExpenseBreakdownCards {...expenseData} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <InvoiceRevenueChart 
          invoices={invoices}
          timeframe={timeframe} 
          termDateRange={termDateRange}
        />
        <RevenueAllocationChart 
          fees={{
            adminFee: expenseData.totalAdmin,
            trainerFee: expenseData.totalTrainer,
            franchiseFee: expenseData.totalFranchise,
            profit: expenseData.profit
          }}
          totalRevenue={expenseData.totalRevenue}
          showOnlyPaid={false} // Show all revenue for allocation
        />
      </div>
    </>
  );
}
