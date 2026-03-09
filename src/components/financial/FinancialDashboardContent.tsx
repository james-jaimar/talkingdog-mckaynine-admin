
import { useState, useEffect, useMemo } from "react";
import { InvoiceRevenueChart } from "@/components/invoices/reports/InvoiceRevenueChart";
import { RevenueAllocationChart } from "@/components/invoices/reports/RevenueAllocationChart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBranch } from "@/context/BranchContext";
import { FinancialMetricsCards } from "@/components/dashboard/financial/FinancialMetricsCards";
import { ExpenseBreakdownCards } from "@/components/dashboard/financial/ExpenseBreakdownCards";
import { useClassFinancialData } from "@/hooks/useClassFinancialData";
import { useTerm } from "@/context/TermContext";
import { useInvoices } from "@/hooks/useInvoices";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Invoice } from "@/hooks/invoices/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isEnrollmentFeeItem, applyInvoiceDiscountToItems } from "@/lib/invoiceItemUtils";

export function FinancialDashboardContent() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const { currentBranch } = useBranch();
  const { termDateRange, termData } = useTerm();
  const { invoices, isLoading: isLoadingInvoices } = useInvoices();
  const queryClient = useQueryClient();
  const [branchMismatch, setBranchMismatch] = useState(false);
  
  // Use effect to refresh data when term changes
  useEffect(() => {
    if (termData?.id && currentBranch?.id) {
      console.log(`FinancialDashboardContent: Term data changed to ${termData.term_number}, refreshing financial data for branch ${currentBranch.name}`);
      queryClient.invalidateQueries({ queryKey: ['financial-bookings', currentBranch.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices', currentBranch.id] });
    }
  }, [termData?.id, currentBranch?.id, queryClient]);
  
  // Get all active invoices - filtering to only show relevant statuses AND current branch
  const activeInvoices = currentBranch?.id ? invoices.filter((inv: Invoice) => {
    const branchMatch = inv.branch_id === currentBranch?.id;
    const statusMatch = inv.status === 'sent' || inv.status === 'paid' || inv.status === 'overdue';
    
    if (!branchMatch && statusMatch) {
      console.warn(`Invoice ${inv.invoice_number} has mismatched branch. Invoice branch: ${inv.branch_id}, Current branch: ${currentBranch?.id}`);
    }
    
    return branchMatch && statusMatch;
  }) : [];
  
  // Filter invoices by term_id for accurate term attribution
  const termFilteredInvoices = termData?.id 
    ? activeInvoices.filter(inv => inv.term_id === termData.id)
    : activeInvoices;
  
  // Log branch filtering information
  useEffect(() => {
    if (currentBranch?.id) {
      console.log(`FinancialDashboardContent: Current branch is ${currentBranch.name} (${currentBranch.id})`);
      console.log(`Total invoices: ${invoices.length}, filtered for branch: ${activeInvoices.length}, filtered for term: ${termFilteredInvoices.length}`);
    }
  }, [currentBranch?.id, invoices.length, activeInvoices.length, termFilteredInvoices.length]);
  
  // Calculate revenue metrics from invoices
  const revenueMetrics = useMemo(() => {
    let courseRevenue = 0;
    let enrollmentFees = 0;
    let collectedCourse = 0;
    let pendingCourse = 0;
    let overdueCourse = 0;

    termFilteredInvoices.forEach(inv => {
      if (inv.items && inv.items.length > 0) {
        const itemsWithInvoiceData = inv.items.map(item => ({
          ...item,
          invoice_id: inv.id,
          invoices: {
            subtotal: inv.subtotal,
            monetary_discount: inv.monetary_discount,
            discount_type: inv.discount_type,
            discount_amount: inv.discount_amount,
            status: inv.status,
          },
        }));

        const discountedItems = applyInvoiceDiscountToItems(itemsWithInvoiceData as any);

        discountedItems.forEach(item => {
          const amount = (item as any).net_amount ?? item.amount ?? 0;

          if (isEnrollmentFeeItem(item as any)) {
            enrollmentFees += amount;
            return;
          }

          courseRevenue += amount;
          if (inv.status === 'paid') collectedCourse += amount;
          else if (inv.status === 'sent') pendingCourse += amount;
          else if (inv.status === 'overdue') overdueCourse += amount;
        });
      } else {
        courseRevenue += inv.total;
        if (inv.status === 'paid') collectedCourse += inv.total;
        else if (inv.status === 'sent') pendingCourse += inv.total;
        else if (inv.status === 'overdue') overdueCourse += inv.total;
      }
    });

    return {
      totalRevenue: courseRevenue,
      enrollmentFees,
      collectedRevenue: collectedCourse,
      pendingRevenue: pendingCourse,
      overdueRevenue: overdueCourse,
    };
  }, [termFilteredInvoices]);
  
  const { enrollmentFees, collectedRevenue, pendingRevenue, overdueRevenue } = revenueMetrics;
  
  // Format date range for query params if available
  const fromDate = termDateRange?.startDate ? new Date(termDateRange.startDate).toISOString() : undefined;
  const toDate = termDateRange?.endDate ? new Date(termDateRange.endDate).toISOString() : undefined;
  
  // Use the class financial data hook to get accurate financial information
  const { 
    classFinances, 
    isLoading,
    error
  } = useClassFinancialData(currentBranch?.id, fromDate, toDate);
  
  // Verify that all class finances are from the correct branch
  useEffect(() => {
    if (currentBranch?.id && classFinances.length > 0) {
      const mismatch = classFinances.some(c => 
        c.branch_id && c.branch_id !== currentBranch.id
      );
      
      if (mismatch) {
        console.error(`Found financial data for incorrect branch. Current branch: ${currentBranch.id}`);
        setBranchMismatch(true);
      } else {
        setBranchMismatch(false);
      }
    }
  }, [classFinances, currentBranch?.id]);
  
  // Calculate all financial metrics from class finances
  const totalAdmin = classFinances.reduce((sum, item) => sum + item.adminFee, 0);
  const totalTrainer = classFinances.reduce((sum, item) => sum + item.instructorFee, 0);
  const totalFranchise = classFinances.reduce((sum, item) => sum + item.franchiseFee, 0);
  const classFinancesTotalRevenue = classFinances.reduce((sum, item) => sum + item.totalRevenue, 0);
  
  const totalRevenue = classFinancesTotalRevenue;
  const profit = totalRevenue - totalAdmin - totalTrainer - totalFranchise;
  
  // Debug the calculated values
  console.log("Financial Dashboard calculations:", {
    branchId: currentBranch?.id,
    branchName: currentBranch?.name,
    totalRevenue,
    collectedRevenue,
    pendingRevenue,
    overdueRevenue,
    totalAdmin,
    totalTrainer,
    totalFranchise,
    profit,
    invoicesCount: termFilteredInvoices.length,
    termDateRange,
    currentTermNumber: termData?.term_number
  });

  // Expense breakdown data
  const expenseData = {
    totalAdmin,
    totalTrainer,
    totalFranchise,
    profit,
    totalRevenue
  };

  // Handle refresh button click
  const handleRefresh = () => {
    if (currentBranch?.id) {
      queryClient.invalidateQueries({ queryKey: ['financial-bookings', currentBranch.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices', currentBranch.id] });
      queryClient.removeQueries({ queryKey: ['financial-bookings'] });
      toast.success(`Refreshing financial data for ${currentBranch.name}`);
    }
  };

  if (isLoading || isLoadingInvoices) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg">Loading financial data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading financial data. Please try again or contact support.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <button 
            onClick={handleRefresh} 
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry Loading Data
          </button>
        </div>
      </div>
    );
  }
  
  if (branchMismatch) {
    return (
      <div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The financial data contains information from other branches. 
            Please refresh the data to ensure you are seeing data only from {currentBranch?.name}.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <button 
            onClick={handleRefresh} 
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Refresh Financial Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground">
            Branch: {currentBranch?.name || 'No branch selected'} |
            Term: {termData?.term_number || 'No term selected'}
          </p>
        </div>
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={handleRefresh} 
            className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
          >
            Refresh
          </button>
          
          <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)} className="w-fit">
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Financial metrics cards */}
      <FinancialMetricsCards 
        totalRevenue={revenueMetrics.totalRevenue}
        collectedRevenue={collectedRevenue}
        pendingRevenue={pendingRevenue}
        overdueRevenue={overdueRevenue}
        enrollmentFees={enrollmentFees}
      />

      {/* Expense breakdown cards with profit included */}
      <ExpenseBreakdownCards {...expenseData} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InvoiceRevenueChart 
          invoices={termFilteredInvoices}
          timeframe={timeframe} 
          termDateRange={termDateRange}
        />
        <RevenueAllocationChart 
          fees={{
            adminFee: totalAdmin,
            trainerFee: totalTrainer,
            franchiseFee: totalFranchise,
            profit: profit
          }}
          totalRevenue={totalRevenue}
          showOnlyPaid={false}
        />
      </div>
    </div>
  );
}
