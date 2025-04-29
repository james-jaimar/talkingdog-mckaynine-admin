
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useInvoices } from "@/hooks/useInvoices";
import { InvoicesList } from "@/components/invoices/InvoicesList";
import { InvoiceCreateDialog } from "@/components/invoices/InvoiceCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw } from "lucide-react";
import { InvoiceStatus } from "@/types/invoice";
import { useQueryClient } from "@tanstack/react-query";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { InvoiceFinancialSummary } from "@/components/invoices/summary/InvoiceFinancialSummary";
import { InvoiceFilterTabs } from "@/components/invoices/filters/InvoiceFilterTabs";
import { useTerm } from "@/context/TermContext";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Invoices() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState<string>("current");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { invoices, isLoading, error, refreshAllInvoiceQueries } = useInvoices();
  const queryClient = useQueryClient();
  const { termDateRange } = useTerm();

  // Set the month filter to "term" if a term is selected
  useEffect(() => {
    if (termDateRange) {
      setMonthFilter("term");
    }
  }, [termDateRange?.startDate, termDateRange?.endDate]);

  // Auto-refresh data when component mounts
  useEffect(() => {
    console.log("Invoices page: Initial data load");
    refreshAllInvoiceQueries();
  }, [refreshAllInvoiceQueries]);

  // Refresh data when create dialog closes
  useEffect(() => {
    if (!createDialogOpen) {
      console.log("Create dialog closed, refreshing data");
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  }, [createDialogOpen, queryClient]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAllInvoiceQueries();
      toast.success("Invoice data refreshed");
    } catch (error) {
      console.error("Error refreshing invoice data:", error);
      toast.error("Failed to refresh invoice data. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get date ranges for month filtering
  const getCurrentMonthRange = () => {
    const now = new Date();
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
      label: format(now, "MMMM yyyy")
    };
  };

  const getPreviousMonthRange = (monthsBack: number) => {
    const date = subMonths(new Date(), monthsBack);
    return {
      start: startOfMonth(date),
      end: endOfMonth(date),
      label: format(date, "MMMM yyyy")
    };
  };

  // Add term date range to the options
  const monthRanges = {
    "current": getCurrentMonthRange(),
    "prev1": getPreviousMonthRange(1),
    "prev2": getPreviousMonthRange(2),
    "prev3": getPreviousMonthRange(3),
    "term": termDateRange 
      ? { 
          start: new Date(termDateRange.startDate), 
          end: new Date(termDateRange.endDate), 
          label: `Term Period ${format(new Date(termDateRange.startDate), "dd MMM")} - ${format(new Date(termDateRange.endDate), "dd MMM yyyy")}` 
        }
      : getCurrentMonthRange(),
    "all": { start: new Date(0), end: new Date(8640000000000000), label: "All Time" }
  };

  // Filter invoices by status and month
  const filteredInvoices = invoices?.filter(invoice => {
    const statusMatch = statusFilter === 'all' || invoice.status === statusFilter;
    
    if (monthFilter === "all") {
      return statusMatch;
    }
    
    const invoiceDate = new Date(invoice.issued_date);
    const range = monthRanges[monthFilter as keyof typeof monthRanges];
    const dateMatch = invoiceDate >= range.start && invoiceDate <= range.end;
    
    return statusMatch && dateMatch;
  }) || [];

  return (
    <DashboardLayout>
      <Helmet>
        <title>Invoices - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="text-3xl font-bold">Invoices</h1>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              aria-label="Refresh invoice data"
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Invoice
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load invoice data. Please try refreshing the page.
              {error instanceof Error ? ` Error: ${error.message}` : ''}
            </AlertDescription>
          </Alert>
        )}

        <InvoiceFinancialSummary 
          invoices={filteredInvoices} 
          currentMonthLabel={monthRanges[monthFilter as keyof typeof monthRanges].label} 
        />

        <InvoiceFilterTabs 
          onMonthFilterChange={setMonthFilter}
          onStatusFilterChange={setStatusFilter}
          showTermOption={!!termDateRange}
        />
        
        <InvoicesList 
          invoices={filteredInvoices} 
          isLoading={isLoading || isRefreshing} 
          currentMonthLabel={monthRanges[monthFilter as keyof typeof monthRanges].label}
        />
        
        <InvoiceCreateDialog 
          open={createDialogOpen} 
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              refreshAllInvoiceQueries();
            }
          }} 
        />
      </div>
    </DashboardLayout>
  );
}
