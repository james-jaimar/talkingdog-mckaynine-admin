
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useInvoices } from "@/hooks/useInvoices";
import { useBranch } from "@/context/BranchContext";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RevenueBreakdownCard } from "@/components/dashboard/financial/RevenueBreakdownCard";
import { RevenueTrendsChart } from "@/components/dashboard/financial/RevenueTrendsChart";
import { TrainerPaymentReport } from "@/components/dashboard/financial/TrainerPaymentReport";
import { BranchComparisonChart } from "@/components/dashboard/financial/BranchComparisonChart";
import { DateRangePicker } from "@/components/dashboard/financial/DateRangePicker";
import { addMonths, startOfMonth, endOfMonth, subMonths } from "date-fns";

export default function FinancialReports() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 3)),
    to: endOfMonth(new Date())
  });
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const { invoices, isLoading } = useInvoices();
  const { currentBranch } = useBranch();

  return (
    <RequireAdmin>
      <DashboardLayout>
        <Helmet>
          <title>Financial Reports - McKaynine Training Centre</title>
        </Helmet>
        
        <div className="container mx-auto py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">Financial Reports</h1>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <DateRangePicker 
                dateRange={dateRange} 
                onDateRangeChange={setDateRange} 
              />
              
              <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)} className="w-fit">
                <TabsList>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Revenue Breakdown Card */}
          <div className="mb-6">
            <RevenueBreakdownCard 
              invoices={invoices} 
              dateRange={dateRange}
              isLoading={isLoading}
            />
          </div>

          {/* Revenue Trends Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RevenueTrendsChart
              invoices={invoices}
              timeframe={timeframe}
              dateRange={dateRange}
              isLoading={isLoading}
            />
            <BranchComparisonChart
              branchId={currentBranch?.id}
              timeframe={timeframe}
              dateRange={dateRange}
              isLoading={isLoading}
            />
          </div>

          {/* Trainer Payment Report */}
          <div className="mb-6">
            <TrainerPaymentReport
              branchId={currentBranch?.id}
              dateRange={dateRange}
              isLoading={isLoading}
            />
          </div>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
