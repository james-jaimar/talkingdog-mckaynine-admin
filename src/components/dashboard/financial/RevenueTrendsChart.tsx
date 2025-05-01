
import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Invoice } from "@/hooks/invoices/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { ChartContainer } from "@/components/ui/chart";
import { Loader2 } from "lucide-react";
import { isWithinInterval, format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";

interface RevenueTrendsChartProps {
  invoices: Invoice[];
  timeframe: 'monthly' | 'quarterly' | 'yearly';
  dateRange: { from: Date; to?: Date };
  isLoading: boolean;
}

export function RevenueTrendsChart({ invoices, timeframe, dateRange, isLoading }: RevenueTrendsChartProps) {
  const chartData = useMemo(() => {
    if (!invoices?.length) return [];

    // Filter invoices by date range
    const endDate = dateRange.to || dateRange.from;
    const filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.issued_date);
      return isWithinInterval(invoiceDate, {
        start: dateRange.from,
        end: endDate
      });
    });

    // Group invoices by period based on timeframe
    const groupedData: Record<string, {
      name: string;
      totalRevenue: number;
      paidRevenue: number;
      pendingRevenue: number;
      overdueRevenue: number;
    }> = {};

    filteredInvoices.forEach(invoice => {
      const date = new Date(invoice.issued_date);
      let periodKey: string;
      let periodLabel: string;
      
      if (timeframe === 'monthly') {
        const year = date.getFullYear();
        const month = date.getMonth();
        periodKey = `${year}-${month.toString().padStart(2, '0')}`;
        periodLabel = format(date, "MMM yyyy");
      } else if (timeframe === 'quarterly') {
        const year = date.getFullYear();
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        periodKey = `${year}-Q${quarter}`;
        periodLabel = `Q${quarter} ${year}`;
      } else { // yearly
        const year = date.getFullYear();
        periodKey = year.toString();
        periodLabel = year.toString();
      }

      if (!groupedData[periodKey]) {
        groupedData[periodKey] = {
          name: periodLabel,
          totalRevenue: 0,
          paidRevenue: 0,
          pendingRevenue: 0,
          overdueRevenue: 0
        };
      }

      // Add invoice amount to appropriate category
      // Use the total field which already includes any discounts applied
      const amount = invoice.total;
      groupedData[periodKey].totalRevenue += amount;
      
      if (invoice.status === 'paid') {
        groupedData[periodKey].paidRevenue += amount;
      } else if (invoice.status === 'sent') {
        groupedData[periodKey].pendingRevenue += amount;
      } else if (invoice.status === 'overdue') {
        groupedData[periodKey].overdueRevenue += amount;
      }
    });

    // Convert to array and sort by period
    return Object.values(groupedData).sort((a, b) => a.name.localeCompare(b.name));
  }, [invoices, timeframe, dateRange]);

  if (isLoading) {
    return (
      <Card className="w-full h-96">
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="w-full h-96">
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <p className="text-muted-foreground">No data available for the selected period</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-96">
      <CardHeader>
        <CardTitle>Revenue Trends</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ChartContainer
          config={{
            paidRevenue: { label: "Collected", color: "#10B981" },
            pendingRevenue: { label: "Pending", color: "#F59E0B" },
            overdueRevenue: { label: "Overdue", color: "#EF4444" }
          }}
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Legend />
              <Bar dataKey="paidRevenue" name="Collected" fill="#10B981" stackId="stack" />
              <Bar dataKey="pendingRevenue" name="Pending" fill="#F59E0B" stackId="stack" />
              <Bar dataKey="overdueRevenue" name="Overdue" fill="#EF4444" stackId="stack" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
