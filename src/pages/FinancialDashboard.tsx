
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceRevenueChart } from "@/components/invoices/reports/InvoiceRevenueChart";
import { RevenueAllocationChart } from "@/components/invoices/reports/RevenueAllocationChart";
import { TrainerPaymentsSummary } from "@/components/invoices/reports/TrainerPaymentsSummary";
import { useInvoices } from "@/hooks/useInvoices";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { useBranch } from "@/context/BranchContext";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { DollarSign, Users, Calendar, TrendingUp } from "lucide-react";

export default function FinancialDashboard() {
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const { invoices, isLoading } = useInvoices();
  const { currentBranch } = useBranch();
  
  // Fetch trainers data with actual data from database
  const { data: trainers = [], isLoading: isTrainersLoading } = useQuery({
    queryKey: ['trainers', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch) return [];
      
      const { data, error } = await supabase
        .from('trainers')
        .select(`
          id,
          first_name,
          last_name,
          invoices:invoice_items(
            id,
            amount,
            invoice:invoices(status, payment_date)
          )
        `)
        .eq('branch_id', currentBranch.id);
      
      if (error) throw error;
      
      return data.map(trainer => {
        const invoiceItems = trainer.invoices || [];
        const totalEarned = invoiceItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
        const paidInvoices = invoiceItems.filter((item: any) => item.invoice?.status === 'paid');
        const paidAmount = paidInvoices.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
        const lastPaymentDate = paidInvoices.length > 0 
          ? Math.max(...paidInvoices.map((item: any) => new Date(item.invoice.payment_date).getTime()))
          : null;

        return {
          id: trainer.id,
          trainerName: `${trainer.first_name} ${trainer.last_name}`,
          totalEarned,
          paid: paidAmount,
          pending: totalEarned - paidAmount,
          invoicesCount: invoiceItems.length,
          lastPaymentDate: lastPaymentDate ? new Date(lastPaymentDate).toISOString() : undefined
        };
      });
    },
    enabled: !!currentBranch?.id
  });

  // Calculate financial metrics from actual invoice data
  const financialMetrics = {
    totalRevenue: invoices ? invoices.reduce((sum, invoice) => sum + invoice.total, 0) : 0,
    collectedRevenue: invoices ? invoices.filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0) : 0,
    pendingRevenue: invoices ? invoices.filter(invoice => invoice.status === 'sent')
      .reduce((sum, invoice) => sum + invoice.total, 0) : 0,
    overdueRevenue: invoices ? invoices.filter(invoice => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + invoice.total, 0) : 0
  };

  return (
    <RequireAdmin>
      <DashboardLayout>
        <Helmet>
          <title>Financial Dashboard - McKaynine Training Centre</title>
        </Helmet>
        
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Financial Dashboard</h1>
            
            <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)} className="w-fit">
              <TabsList>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Financial summary cards */}
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
                  <span className="text-2xl font-bold">
                    {formatCurrency(financialMetrics.totalRevenue)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Collected Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-2xl font-bold text-green-500">
                    {formatCurrency(financialMetrics.collectedRevenue)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((financialMetrics.collectedRevenue / financialMetrics.totalRevenue) * 100).toFixed(1)}% of total revenue
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-amber-500 mr-2" />
                  <span className="text-2xl font-bold text-amber-500">
                    {formatCurrency(financialMetrics.pendingRevenue)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((financialMetrics.pendingRevenue / financialMetrics.totalRevenue) * 100).toFixed(1)}% of total revenue
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Overdue Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-2xl font-bold text-red-500">
                    {formatCurrency(financialMetrics.overdueRevenue)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((financialMetrics.overdueRevenue / financialMetrics.totalRevenue) * 100).toFixed(1)}% of total revenue
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <InvoiceRevenueChart invoices={invoices} timeframe={timeframe} />
            <RevenueAllocationChart invoices={invoices} />
          </div>

          {/* Trainer payments summary */}
          <div className="mb-6">
            <TrainerPaymentsSummary trainers={trainers} isLoading={isTrainersLoading} />
          </div>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
