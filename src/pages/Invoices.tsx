
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useInvoices } from "@/hooks/useInvoices";
import { InvoicesList } from "@/components/invoices/InvoicesList";
import { InvoiceCreateDialog } from "@/components/invoices/InvoiceCreateDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Filter, DollarSign, BadgePercent, AlertCircle } from "lucide-react";
import { InvoiceStatus } from "@/types/invoice";
import { useQueryClient } from "@tanstack/react-query";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

export default function Invoices() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState<string>("current"); // Default to current month
  const { invoices, isLoading, refreshAllInvoiceQueries } = useInvoices();
  const queryClient = useQueryClient();

  // Auto-refresh data when component mounts
  useEffect(() => {
    console.log("Invoices page: Refreshing data");
    refreshAllInvoiceQueries();
  }, [refreshAllInvoiceQueries]);

  // Refresh data when create dialog closes (in case an invoice was created)
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

  const monthRanges = {
    "current": getCurrentMonthRange(),
    "prev1": getPreviousMonthRange(1),
    "prev2": getPreviousMonthRange(2),
    "prev3": getPreviousMonthRange(3),
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

  // Calculate financial summary for the current filter
  const calculateFinancialSummary = () => {
    const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const paidAmount = filteredInvoices.reduce((sum, invoice) => 
      invoice.status === 'paid' ? sum + invoice.total : sum, 0);
    const outstandingAmount = filteredInvoices.reduce((sum, invoice) => 
      (invoice.status === 'sent' || invoice.status === 'overdue') ? sum + invoice.total : sum, 0);
    const overdueAmount = filteredInvoices.reduce((sum, invoice) => 
      invoice.status === 'overdue' ? sum + invoice.total : sum, 0);
    
    // Calculate collection rate (paid amount / total amount)
    const collectionRate = totalAmount > 0 
      ? Math.round((paidAmount / totalAmount) * 100) 
      : 0;
    
    return {
      totalAmount,
      paidAmount,
      outstandingAmount,
      overdueAmount,
      collectionRate
    };
  };
  
  const financialSummary = calculateFinancialSummary();

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

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-2xl font-bold">{formatCurrency(financialSummary.totalAmount)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {monthRanges[monthFilter as keyof typeof monthRanges].label}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Collection Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BadgePercent className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-2xl font-bold">{financialSummary.collectionRate}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(financialSummary.paidAmount)} of {formatCurrency(financialSummary.totalAmount)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-amber-500 mr-2" />
                <span className="text-2xl font-bold text-amber-500">
                  {formatCurrency(financialSummary.outstandingAmount)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting payment
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-2xl font-bold text-red-500">
                  {formatCurrency(financialSummary.overdueAmount)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Past due date
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Month tabs */}
        <Tabs defaultValue="current" className="mb-4" onValueChange={setMonthFilter}>
          <div className="flex items-center justify-between">
            <TabsList className="grid grid-cols-5 w-full max-w-md">
              <TabsTrigger value="current">
                {format(new Date(), "MMM yyyy")}
              </TabsTrigger>
              <TabsTrigger value="prev1">
                {format(subMonths(new Date(), 1), "MMM yyyy")}
              </TabsTrigger>
              <TabsTrigger value="prev2">
                {format(subMonths(new Date(), 2), "MMM yyyy")}
              </TabsTrigger>
              <TabsTrigger value="prev3">
                {format(subMonths(new Date(), 3), "MMM yyyy")}
              </TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {/* Status tabs */}
        <Tabs defaultValue="all" className="mb-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setStatusFilter('all')}>
                All
              </TabsTrigger>
              <TabsTrigger value="draft" onClick={() => setStatusFilter('draft')}>
                Draft
              </TabsTrigger>
              <TabsTrigger value="sent" onClick={() => setStatusFilter('sent')}>
                Sent
              </TabsTrigger>
              <TabsTrigger value="paid" onClick={() => setStatusFilter('paid')}>
                Paid
              </TabsTrigger>
              <TabsTrigger value="overdue" onClick={() => setStatusFilter('overdue')}>
                Overdue
              </TabsTrigger>
              <TabsTrigger value="cancelled" onClick={() => setStatusFilter('cancelled')}>
                Cancelled
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
        
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
              // Refresh data when dialog closes
              refreshAllInvoiceQueries();
            }
          }} 
        />
      </div>
    </DashboardLayout>
  );
}
