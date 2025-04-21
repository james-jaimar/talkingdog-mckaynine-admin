import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useInvoices } from "@/hooks/useInvoices";
import { useBranch } from "@/context/BranchContext";
import { useQueryClient } from "@tanstack/react-query";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { InvoiceRevenueChart } from "@/components/invoices/reports/InvoiceRevenueChart";
import { ClassFinancialReport } from "@/components/invoices/reports/ClassFinancialReport";
import { ClassesListReport } from "@/components/invoices/reports/ClassesListReport";
import { DateRangePicker } from "@/components/dashboard/financial/DateRangePicker";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react"; 
import { toast } from "sonner";
import { TrainerReportsTab } from "@/components/invoices/reports/TrainerReportsTab";
import { ExpenseBreakdownCards } from "@/components/dashboard/financial/ExpenseBreakdownCards";
import { ClassExpenseBreakdownTable } from "@/components/invoices/reports/ClassExpenseBreakdownTable";
import { TotalExpenseBreakdownSummary } from "@/components/invoices/reports/TotalExpenseBreakdownSummary";
import { useClassFinancialData } from "@/hooks/useClassFinancialData";

export default function FinancialReports() {
  const queryClient = useQueryClient();
  
  // Set default date range to current month
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 0)), // Current month
    to: endOfMonth(new Date())
  });
  
  const { currentBranch } = useBranch();
  const { invoices, isLoading, refreshAllInvoiceQueries } = useInvoices();

  // --- Gather expense breakdown data from invoices for summary cards ---
  const activeInvoices = invoices
    ? invoices.filter(invoice => 
        invoice.status !== 'cancelled' && 
        (invoice.status === 'sent' || invoice.status === 'paid' || invoice.status === 'overdue')
      )
    : [];

  const totalAdmin = activeInvoices.reduce((sum, inv) => sum + (inv.admin_fee || 0), 0);
  const totalTrainer = activeInvoices.reduce((sum, inv) => sum + (inv.trainer_fee || 0), 0);
  const totalFranchise = activeInvoices.reduce((sum, inv) => sum + (inv.franchise_fee || 0), 0);
  const totalRevenue = activeInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  // --- Gather class-level breakdowns via useClassFinancialData ---
  const { classFinances } = useClassFinancialData(currentBranch?.id, dateRange.from?.toISOString(), dateRange.to?.toISOString());

  // Prepare for the table
  const classBreakdowns = (classFinances ?? []).map((c) => ({
    className: c.className,
    adminFee: c.adminFee,
    trainerFee: c.instructorFee,
    franchiseFee: c.franchiseFee,
    totalRevenue: c.totalRevenue,
  }));

  // Refresh data when component mounts, branch changes or date range changes
  useEffect(() => {
    if (currentBranch) {
      console.log("Financial Reports: Branch or date range changed, refreshing data");
      refreshFinancialData();
    }
  }, [currentBranch, dateRange]);

  // Function to refresh all financial data
  const refreshFinancialData = () => {
    // Invalidate all relevant queries first
    queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['classes-list-data'] });
    queryClient.invalidateQueries({ queryKey: ['trainer-payments'] });
    
    // Then refresh invoice data
    refreshAllInvoiceQueries();
    
    toast.success("Financial data refreshed");
  };

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

          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Important Financial Information</AlertTitle>
            <AlertDescription>
              This report includes both booking-associated invoices and general training invoices 
              that don't have specific class associations. Any invoice items without booking associations 
              will appear under "General Training Services".
            </AlertDescription>
          </Alert>

          {/* Global expense breakdown summary cards */}
          <ExpenseBreakdownCards
            totalAdmin={totalAdmin}
            totalTrainer={totalTrainer}
            totalFranchise={totalFranchise}
            totalRevenue={totalRevenue}
          />

          {/* Expense summary block */}
          <TotalExpenseBreakdownSummary 
            admin={totalAdmin} 
            trainer={totalTrainer} 
            franchise={totalFranchise}
          />

          <Tabs defaultValue="financial" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="financial">Financial Report</TabsTrigger>
              <TabsTrigger value="classes">Classes List</TabsTrigger>
              <TabsTrigger value="trainers">Trainers</TabsTrigger>
            </TabsList>

            <TabsContent value="financial">
              <div className="space-y-6">
                <ClassFinancialReport 
                  dateRange={dateRange} 
                  onRefreshSuccess={() => {
                    // When class financials are refreshed, also refresh invoice data
                    refreshAllInvoiceQueries();
                    toast.success("Financial data refreshed");
                  }} 
                />
                {/* Per-class expense breakdown table */}
                <ClassExpenseBreakdownTable breakdowns={classBreakdowns} />
                <InvoiceRevenueChart 
                  invoices={invoices} 
                  timeframe="monthly"
                />
              </div>
            </TabsContent>

            <TabsContent value="classes">
              <ClassesListReport />
            </TabsContent>
            
            <TabsContent value="trainers">
              <TrainerReportsTab 
                dateRange={dateRange}
                branchId={currentBranch?.id}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
