
import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice } from "@/types/invoice";
import { formatCurrency } from "@/lib/formatters";
import { Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface InvoiceRevenueChartProps {
  invoices: Invoice[];
  timeframe?: 'monthly' | 'quarterly' | 'yearly';
}

export function InvoiceRevenueChart({ invoices, timeframe = 'monthly' }: InvoiceRevenueChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!invoices || invoices.length === 0) {
      setChartData([]);
      setIsLoading(false);
      return;
    }

    // Process invoice data for chart display
    const processData = () => {
      setIsLoading(true);
      
      const data: Record<string, { 
        name: string, 
        totalRevenue: number, 
        paidRevenue: number,
        pendingRevenue: number,
        overdueRevenue: number
      }> = {};

      // Group by month/quarter/year based on timeframe
      invoices.forEach(invoice => {
        const date = new Date(invoice.issued_date);
        let period: string;
        
        if (timeframe === 'monthly') {
          period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else if (timeframe === 'quarterly') {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          period = `${date.getFullYear()} Q${quarter}`;
        } else {
          period = `${date.getFullYear()}`;
        }

        if (!data[period]) {
          data[period] = {
            name: period,
            totalRevenue: 0,
            paidRevenue: 0,
            pendingRevenue: 0,
            overdueRevenue: 0
          };
        }

        data[period].totalRevenue += invoice.total;
        
        if (invoice.status === 'paid') {
          data[period].paidRevenue += invoice.total;
        } else if (invoice.status === 'sent') {
          data[period].pendingRevenue += invoice.total;
        } else if (invoice.status === 'overdue') {
          data[period].overdueRevenue += invoice.total;
        }
      });

      // Convert to array and sort by date
      const sortedData = Object.values(data).sort((a, b) => {
        return a.name.localeCompare(b.name);
      });

      setChartData(sortedData);
      setIsLoading(false);
    };

    processData();
  }, [invoices, timeframe]);

  if (isLoading) {
    return (
      <Card className="w-full h-80">
        <CardHeader>
          <CardTitle>Revenue Analysis</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="w-full h-80">
        <CardHeader>
          <CardTitle>Revenue Analysis</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No invoice data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-80">
      <CardHeader>
        <CardTitle>Revenue Analysis ({timeframe === 'monthly' ? 'Monthly' : timeframe === 'quarterly' ? 'Quarterly' : 'Yearly'})</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ChartContainer
          config={{
            totalRevenue: { label: "Total Revenue", color: "#1E40AF" },
            paidRevenue: { label: "Collected", color: "#10B981" },
            pendingRevenue: { label: "Pending", color: "#F59E0B" },
            overdueRevenue: { label: "#EF4444" }
          }}
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip 
                content={({active, payload, label}) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <div className="font-medium">{label}</div>
                        {payload.map((entry, index) => (
                          <div key={`item-${index}`} className="flex items-center gap-2 text-sm">
                            <div style={{ backgroundColor: entry.color }} className="size-3 rounded-full" />
                            <span className="text-muted-foreground">{entry.name}: </span>
                            <span>{formatCurrency(entry.value as number)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
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
