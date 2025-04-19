
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import { Invoice } from "@/types/invoice";
import { formatCurrency } from "@/lib/formatters";
import { ChartContainer } from "@/components/ui/chart";
import { useRevenueChartData, TimeFrame } from "@/hooks/charts/useRevenueChartData";

interface InvoiceRevenueChartProps {
  invoices: Invoice[];
  timeframe?: TimeFrame;
}

export function InvoiceRevenueChart({ invoices, timeframe = 'monthly' }: InvoiceRevenueChartProps) {
  // Filter out cancelled invoices before passing to the hook
  const activeInvoices = invoices ? invoices.filter(invoice => 
    invoice.status !== 'cancelled' && 
    (invoice.status === 'sent' || invoice.status === 'paid' || invoice.status === 'overdue')
  ) : [];
  
  const { chartData } = useRevenueChartData(activeInvoices, timeframe);

  if (!chartData.length) {
    return (
      <Card className="w-full h-80">
        <CardHeader>
          <CardTitle>Revenue Analysis</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          {!invoices ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-muted-foreground">No invoice data available</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-80">
      <CardHeader>
        <CardTitle>
          Revenue Analysis ({timeframe === 'monthly' ? 'Monthly' : timeframe === 'quarterly' ? 'Quarterly' : 'Yearly'})
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64">
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
