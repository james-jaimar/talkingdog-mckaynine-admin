
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useInvoices } from "@/hooks/useInvoices";
import { useBranch } from "@/context/BranchContext";
import { useQueryClient } from "@tanstack/react-query";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { InvoiceRevenueChart } from "@/components/invoices/reports/InvoiceRevenueChart";
import { TrainerPaymentsSummary } from "@/components/invoices/reports/TrainerPaymentsSummary";
import { ClassFinancialReport } from "@/components/invoices/reports/ClassFinancialReport";
import { ClassesListReport } from "@/components/invoices/reports/ClassesListReport";
import { DateRangePicker } from "@/components/dashboard/financial/DateRangePicker";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FinancialReports() {
  const queryClient = useQueryClient();
  
  // Set default date range to current month
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 0)), // Current month
    to: endOfMonth(new Date())
  });
  
  const { currentBranch } = useBranch();
  const { invoices, isLoading, refreshAllInvoiceQueries } = useInvoices();
  
  // Refresh data when component mounts or branch changes
  useEffect(() => {
    if (currentBranch) {
      console.log("Financial Reports: Branch changed, refreshing data");
      refreshAllInvoiceQueries();
      queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
    }
  }, [currentBranch, refreshAllInvoiceQueries, queryClient]);

  // Handle date range changes
  const handleDateRangeChange = (range: { from: Date; to?: Date }) => {
    setDateRange({
      from: range.from,
      to: range.to || endOfMonth(new Date())
    });
    
    // Refresh data when date range changes
    queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
  };

  return (
    <RequireAdmin>
      <DashboardLayout>
        <Helmet>
          <title>Financial Reports - McKaynine Training Centre</title>
        </Helmet>
        
        <div className="container mx-auto py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">Financial Reports</h1>
            <DateRangePicker 
              dateRange={dateRange} 
              onDateRangeChange={handleDateRangeChange} 
            />
          </div>

          <Tabs defaultValue="financial" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="financial">Financial Report</TabsTrigger>
              <TabsTrigger value="classes">Classes List</TabsTrigger>
            </TabsList>

            <TabsContent value="financial">
              <div className="space-y-6">
                <ClassFinancialReport dateRange={dateRange} />
                <InvoiceRevenueChart 
                  invoices={invoices} 
                  timeframe="monthly"
                />
                <TrainerPaymentsSummary
                  trainers={[]} 
                  isLoading={isLoading}
                />
              </div>
            </TabsContent>

            <TabsContent value="classes">
              <ClassesListReport />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
