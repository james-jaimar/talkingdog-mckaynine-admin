import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useInvoices } from "@/hooks/useInvoices";
import { useBranch } from "@/context/BranchContext";
import { useQueryClient } from "@tanstack/react-query";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { ClassFinancialReport } from "@/components/invoices/reports/ClassFinancialReport";
import { ClassesListReport } from "@/components/invoices/reports/ClassesListReport";
import { FranchiseClassesReport } from "@/components/invoices/reports/FranchiseClassesReport";
import { StarterKitsReport } from "@/components/invoices/reports/StarterKitsReport";
import { startOfMonth, endOfMonth } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TrainerReportsTab } from "@/components/invoices/reports/TrainerReportsTab";
import { useTerm } from "@/context/TermContext";
import { FinancialDashboardContent } from "@/components/financial/FinancialDashboardContent";
import { UnpaidHandlersContent } from "@/components/handlers/UnpaidHandlersContent";

export default function FinancialReports() {
  const queryClient = useQueryClient();
  const { termDateRange, termData } = useTerm();
  
  // Month/year state for Trainers tab (Financial Report now manages its own)
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    termDateRange ? new Date(termDateRange.startDate).getMonth() + 1 : currentDate.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(
    termDateRange ? new Date(termDateRange.startDate).getFullYear() : currentDate.getFullYear()
  );

  // Compute date range for Trainers tab
  const dateRange = {
    from: startOfMonth(new Date(selectedYear, selectedMonth - 1)),
    to: endOfMonth(new Date(selectedYear, selectedMonth - 1))
  };
  
  // Update month/year when term changes
  useEffect(() => {
    if (termDateRange) {
      console.log("FinancialReports: Term date range changed, updating month/year");
      const termStart = new Date(termDateRange.startDate);
      setSelectedMonth(termStart.getMonth() + 1);
      setSelectedYear(termStart.getFullYear());
    }
  }, [termDateRange]);
  
  const { currentBranch } = useBranch();
  const { invoices, isLoading, refreshAllInvoiceQueries } = useInvoices();
  
  // Default to 'dashboard' tab (previously 'financial')
  const [activeTab, setActiveTab] = useState('dashboard');

  // Refresh data when component mounts, branch changes or date range changes
  useEffect(() => {
    if (currentBranch) {
      console.log("Financial Reports: Branch or date range changed, refreshing data");
      refreshFinancialData();
    }
  }, [currentBranch, dateRange]);
  
  // Also refresh when term changes
  useEffect(() => {
    if (termData?.id) {
      console.log(`FinancialReports: Term changed to ${termData.term_number}, refreshing data`);
      refreshFinancialData();
    }
  }, [termData?.id]);

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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <RequireAdmin>
      <DashboardLayout>
        <Helmet>
          <title>Financial - McKaynine Training Centre</title>
        </Helmet>
        
        <div className="container mx-auto py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">Financial</h1>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="financial">Financial Report</TabsTrigger>
              <TabsTrigger value="classes">Classes List</TabsTrigger>
              <TabsTrigger value="franchise">Franchise Report</TabsTrigger>
              <TabsTrigger value="trainers">Trainers</TabsTrigger>
              <TabsTrigger value="starter-kits">Starter Kits</TabsTrigger>
              <TabsTrigger value="unpaid">Unpaid Handlers</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <FinancialDashboardContent />
            </TabsContent>

            <TabsContent value="financial">
              <div className="space-y-6">
                <ClassFinancialReport 
                  onRefreshSuccess={() => {
                    refreshAllInvoiceQueries();
                    toast.success("Financial data refreshed");
                  }} 
                />
              </div>
            </TabsContent>

            <TabsContent value="classes">
              <ClassesListReport />
            </TabsContent>

            <TabsContent value="franchise">
              <FranchiseClassesReport />
            </TabsContent>
            
            <TabsContent value="trainers">
              <TrainerReportsTab 
                dateRange={dateRange}
                branchId={currentBranch?.id}
              />
            </TabsContent>
            
            <TabsContent value="starter-kits">
              <StarterKitsReport />
            </TabsContent>

            <TabsContent value="unpaid">
              <UnpaidHandlersContent />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
