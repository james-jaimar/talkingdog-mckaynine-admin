
import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Invoice } from "@/hooks/invoices/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { Loader2 } from "lucide-react";
import { startOfMonth, endOfMonth, eachMonthOfInterval, format, isWithinInterval } from "date-fns";

interface InvoiceRevenueChartProps {
  invoices: Invoice[];
  timeframe: 'monthly' | 'quarterly' | 'yearly';
  termDateRange?: { 
    startDate: string;
    endDate: string;
  };
  isLoading?: boolean;
}

export function InvoiceRevenueChart({ invoices, timeframe, termDateRange, isLoading = false }: InvoiceRevenueChartProps) {
  const chartData = useMemo(() => {
    // Log incoming parameters
    console.log("InvoiceRevenueChart - rendering with params:", {
      invoicesCount: invoices.length,
      timeframe,
      termStartDate: termDateRange?.startDate,
      termEndDate: termDateRange?.endDate
    });
    
    if (isLoading || !invoices?.length) return [];

    let dateRange;
    
    // Use term date range if available, otherwise use last 6 months
    if (termDateRange?.startDate && termDateRange?.endDate) {
      dateRange = {
        start: new Date(termDateRange.startDate),
        end: new Date(termDateRange.endDate)
      };
    } else {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 6);
      dateRange = { start, end };
    }
    
    console.log("InvoiceRevenueChart - using date range:", dateRange);
    
    // Generate month intervals for the chart
    const months = eachMonthOfInterval(dateRange);
    
    // Initialize data for each month
    const monthlyData = months.map(month => {
      const startOfMonthDate = startOfMonth(month);
      const endOfMonthDate = endOfMonth(month);
      
      // Filter invoices for this month
      const monthInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.issued_date);
        return isWithinInterval(invoiceDate, {
          start: startOfMonthDate,
          end: endOfMonthDate
        });
      });
      
      // Calculate revenue for this month
      const totalRevenue = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const paidRevenue = monthInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);
      const pendingRevenue = monthInvoices
        .filter(inv => inv.status === 'sent')
        .reduce((sum, inv) => sum + inv.total, 0);
      const overdueRevenue = monthInvoices
        .filter(inv => inv.status === 'overdue')
        .reduce((sum, inv) => sum + inv.total, 0);
      
      return {
        name: format(month, 'MMM yyyy'),
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        overdueRevenue,
        month: format(month, 'yyyy-MM')
      };
    });
    
    console.log("InvoiceRevenueChart - generated monthly data:", monthlyData);
    
    // If timeframe is quarterly or yearly, aggregate the monthly data
    if (timeframe === 'quarterly') {
      const quarterlyData = monthlyData.reduce((quarters, month) => {
        const date = new Date(month.month + '-01');
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const year = date.getFullYear();
        const key = `${year}-Q${quarter}`;
        
        if (!quarters[key]) {
          quarters[key] = {
            name: `Q${quarter} ${year}`,
            totalRevenue: 0,
            paidRevenue: 0,
            pendingRevenue: 0,
            overdueRevenue: 0
          };
        }
        
        quarters[key].totalRevenue += month.totalRevenue;
        quarters[key].paidRevenue += month.paidRevenue;
        quarters[key].pendingRevenue += month.pendingRevenue;
        quarters[key].overdueRevenue += month.overdueRevenue;
        
        return quarters;
      }, {} as Record<string, any>);
      
      return Object.values(quarterlyData);
    } else if (timeframe === 'yearly') {
      const yearlyData = monthlyData.reduce((years, month) => {
        const year = new Date(month.month + '-01').getFullYear().toString();
        
        if (!years[year]) {
          years[year] = {
            name: year,
            totalRevenue: 0,
            paidRevenue: 0,
            pendingRevenue: 0,
            overdueRevenue: 0
          };
        }
        
        years[year].totalRevenue += month.totalRevenue;
        years[year].paidRevenue += month.paidRevenue;
        years[year].pendingRevenue += month.pendingRevenue;
        years[year].overdueRevenue += month.overdueRevenue;
        
        return years;
      }, {} as Record<string, any>);
      
      return Object.values(yearlyData);
    }
    
    return monthlyData;
  }, [invoices, timeframe, termDateRange, isLoading]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No data available for the selected period</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trends</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `${value / 1000}k`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="totalRevenue" 
              name="Total Revenue" 
              stroke="#8884d8" 
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="paidRevenue" 
              name="Collected Revenue" 
              stroke="#10b981" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="pendingRevenue" 
              name="Pending Revenue" 
              stroke="#f59e0b" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="overdueRevenue" 
              name="Overdue Revenue" 
              stroke="#ef4444" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
