
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useInvoices } from "@/hooks/useInvoices";
import { useBranch } from "@/context/BranchContext";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { InvoiceRevenueChart } from "@/components/invoices/reports/InvoiceRevenueChart";
import { TrainerPaymentsSummary } from "@/components/invoices/reports/TrainerPaymentsSummary";
import { ClassFinancialReport } from "@/components/invoices/reports/ClassFinancialReport";
import { DateRangePicker } from "@/components/dashboard/financial/DateRangePicker";
import { addMonths, startOfMonth, endOfMonth, subMonths } from "date-fns";

export default function FinancialReports() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 1)), // Default to previous month
    to: endOfMonth(new Date())
  });
  const { currentBranch } = useBranch();
  const { invoices, isLoading } = useInvoices();

  // Handle date range changes
  const handleDateRangeChange = (range: { from: Date; to?: Date }) => {
    setDateRange({
      from: range.from,
      to: range.to || endOfMonth(new Date())
    });
    
    console.log("Date range changed:", {
      from: range.from,
      to: range.to || endOfMonth(new Date())
    });
  };

  // Filter invoices based on date range
  const filteredInvoices = invoices ? invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.issued_date);
    return invoiceDate >= dateRange.from && 
           invoiceDate <= (dateRange.to || new Date());
  }) : [];

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

          {/* Class Financial Report */}
          <div className="mb-6">
            <ClassFinancialReport />
          </div>

          {/* Revenue Chart */}
          <div className="mb-6">
            <InvoiceRevenueChart 
              invoices={filteredInvoices} 
              timeframe="monthly"
            />
          </div>

          {/* Trainer Payments Summary */}
          <div className="mb-6">
            <TrainerPaymentsSummary
              trainers={[]} 
              isLoading={isLoading}
            />
          </div>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
