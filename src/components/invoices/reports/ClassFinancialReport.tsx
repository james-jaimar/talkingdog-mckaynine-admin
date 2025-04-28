import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertTriangle, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useBranch } from "@/context/BranchContext";
import { useClassFinancialData } from "@/hooks/useClassFinancialData";
import { ClassFinancialTable } from "./ClassFinancialTable";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInvoices } from "@/hooks/useInvoices";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ClassFinancialReportProps {
  dateRange?: { from: Date; to: Date };
  onRefreshSuccess?: () => void;
}

export function ClassFinancialReport({ dateRange, onRefreshSuccess }: ClassFinancialReportProps) {
  const { currentBranch } = useBranch();
  const [refreshing, setRefreshing] = useState(false);
  const [showUnallocatedDetails, setShowUnallocatedDetails] = useState(false);
  const queryClient = useQueryClient();
  const { invoices } = useInvoices();
  
  const fromDate = dateRange?.from?.toISOString();
  const toDate = dateRange?.to?.toISOString();

  // Get the total revenue from all active invoices for verification
  const totalInvoiceRevenue = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'paid' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  const { 
    classFinances, 
    isLoading, 
    refreshData, 
    totalInvoiceCount,
    invalidInvoicesCount,
    totalRevenue: directTotalRevenue,
    unallocatedDetails
  } = useClassFinancialData(
    currentBranch?.id,
    fromDate,
    toDate
  );

  // Calculate summary statistics
  const classesTotalRevenue = classFinances.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalBookings = classFinances.reduce((sum, item) => sum + item.bookingsCount, 0);
  const totalProfit = classFinances.reduce((sum, item) => sum + item.profit, 0);
  const profitPercentage = directTotalRevenue > 0 ? (totalProfit / directTotalRevenue) * 100 : 0;
  
  // Calculate unallocated revenue statistics
  const unallocatedItems = classFinances.filter(item => 
    item.sourceType === 'unallocated' || item.className === 'Unallocated Revenue'
  );
  const unallocatedRevenue = unallocatedItems.reduce((sum, item) => sum + item.totalRevenue, 0);
  const unallocatedPercentage = directTotalRevenue > 0 ? (unallocatedRevenue / directTotalRevenue) * 100 : 0;
  
  // Debug revenue comparisons
  useEffect(() => {
    if (!isLoading && classFinances.length > 0) {
      console.log("Class Financial Report - Revenue comparison:", {
        fromClassesSum: classesTotalRevenue,
        fromInvoicesDirectly: directTotalRevenue,
        fromInvoicesHook: totalInvoiceRevenue,
        difference: directTotalRevenue - classesTotalRevenue,
        differencePercent: ((directTotalRevenue - classesTotalRevenue) / directTotalRevenue) * 100,
        unallocatedRevenue,
        unallocatedPercentage
      });
    }
  }, [isLoading, classFinances, directTotalRevenue, totalInvoiceRevenue, unallocatedRevenue, unallocatedPercentage]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // First invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['financial-bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['classes-list-data'] });
      
      // Then refresh the data
      await refreshData();
      
      if (onRefreshSuccess) {
        onRefreshSuccess();
      } else {
        toast.success("Financial data refreshed");
      }
    } catch (error) {
      console.error("Error refreshing financial data:", error);
      toast.error("Failed to refresh financial data");
    } finally {
      // Reset refreshing state
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Class Financial Report</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={true}
          >
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-36">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!classFinances || classFinances.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Class Financial Report</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground py-4">No financial data available for the selected date range</p>
        </CardContent>
      </Card>
    );
  }

  const revenueDiscrepancy = Math.abs(directTotalRevenue - classesTotalRevenue) > 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Class Financial Report</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {totalInvoiceCount} invoices | {totalBookings} bookings | 
            Profit margin: {profitPercentage.toFixed(1)}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unallocatedRevenue > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowUnallocatedDetails(!showUnallocatedDetails)}
            >
              <Info className="h-4 w-4 mr-2" />
              Unallocated Details
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {invalidInvoicesCount > 0 && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Found {invalidInvoicesCount} invalid or problematic {invalidInvoicesCount === 1 ? 'invoice' : 'invoices'} 
              that {invalidInvoicesCount === 1 ? 'has' : 'have'} been excluded from calculations.
              These are invoices without items or without associated bookings.
            </AlertDescription>
          </Alert>
        )}
        
        {unallocatedRevenue > 0 && (
          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {unallocatedPercentage.toFixed(1)}% of revenue (R{unallocatedRevenue.toFixed(2)}) comes from invoices with no direct class bookings.
              These have been categorized based on invoice descriptions and assigned default fee ratios.
            </AlertDescription>
          </Alert>
        )}
        
        {revenueDiscrepancy && (
          <Alert>
            <AlertDescription>
              Note: The total revenue from all invoices (R{directTotalRevenue.toFixed(2)}) doesn't match the sum of class revenues 
              (R{classesTotalRevenue.toFixed(2)}). This may be due to invoices without associated bookings or classes.
            </AlertDescription>
          </Alert>
        )}
        
        {showUnallocatedDetails && unallocatedDetails.length > 0 && (
          <Collapsible open>
            <CollapsibleTrigger asChild>
              <div className="bg-amber-50 p-4 rounded-md cursor-pointer">
                <h3 className="text-md font-medium flex items-center">
                  <Info className="h-4 w-4 mr-2 text-amber-600" />
                  Unallocated Invoices Details ({unallocatedDetails.length})
                </h3>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 p-4 bg-amber-50/50 rounded-md">
                <div className="max-h-60 overflow-y-auto">
                  {unallocatedDetails.map((invoice, index) => (
                    <div key={invoice.id} className="mb-4 p-2 border-b border-amber-200">
                      <div className="flex justify-between">
                        <strong>Invoice #{invoice.invoice_number || index+1}</strong>
                        <span>R{invoice.total.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Client: {invoice.client?.first_name} {invoice.client?.last_name}
                      </div>
                      <div className="mt-2">
                        <span className="text-xs font-semibold">Items:</span>
                        <ul className="text-xs list-disc pl-5">
                          {invoice.items?.map((item: any) => (
                            <li key={item.id}>
                              {item.description} ({item.quantity} × R{item.unit_price?.toFixed(2) || '0.00'})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        <div className="overflow-x-auto">
          <ClassFinancialTable 
            classFinances={classFinances} 
            totalRevenue={directTotalRevenue}
            showMismatchWarning={revenueDiscrepancy}
          />
        </div>
      </CardContent>
    </Card>
  );
}
