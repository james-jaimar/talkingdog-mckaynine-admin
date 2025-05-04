
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { PaymentDocumentsList } from "@/components/invoices/reports/payment-documents/PaymentDocumentsList";
import { DateRangePicker } from "@/components/dashboard/financial/DateRangePicker";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import RequireAdmin from "@/components/auth/RequireAdmin";

export default function PaymentDocuments() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 0)),
    to: endOfMonth(new Date())
  });

  // Handle date range changes
  const handleDateRangeChange = (range: { from: Date; to?: Date }) => {
    setDateRange({
      from: range.from,
      to: range.to || endOfMonth(new Date())
    });
  };

  return (
    <RequireAdmin>
      <DashboardLayout>
        <Helmet>
          <title>Payment Documents - McKaynine Training Centre</title>
        </Helmet>
        
        <div className="container mx-auto py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">Payment Documents</h1>
            <DateRangePicker 
              dateRange={dateRange} 
              onDateRangeChange={handleDateRangeChange} 
            />
          </div>

          <PaymentDocumentsList />
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
