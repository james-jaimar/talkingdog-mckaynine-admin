
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useInvoices } from "@/hooks/useInvoices";
import { InvoicesList } from "@/components/invoices/InvoicesList";
import { InvoiceCreateDialog } from "@/components/invoices/InvoiceCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InvoiceStatus } from "@/types/invoice";
import { useQueryClient } from "@tanstack/react-query";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { InvoiceFinancialSummary } from "@/components/invoices/summary/InvoiceFinancialSummary";
import { InvoiceFilterTabs } from "@/components/invoices/filters/InvoiceFilterTabs";
import { useTerm } from "@/context/TermContext";

export default function Invoices() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState<string>("current");
  const { invoices, isLoading, refreshAllInvoiceQueries } = useInvoices();
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
    console.log("Invoices page: Refreshing data");
    refreshAllInvoiceQueries();
  }, [refreshAllInvoiceQueries]);

  // Refresh data when create dialog closes
  useEffect(() => {
    if (!createDialogOpen) {
      console.log("Create dialog closed, refreshing data");
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  }, [createDialogOpen, queryClient]);

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Invoices</h1>
          
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </div>

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
          isLoading={isLoading} 
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
