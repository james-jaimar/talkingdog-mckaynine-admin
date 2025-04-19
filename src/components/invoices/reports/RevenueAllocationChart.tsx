
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { Invoice } from "@/types/invoice";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { ChartContainer } from "@/components/ui/chart";
import { useAllocationChartData } from "@/hooks/charts/useAllocationChartData";

interface RevenueAllocationChartProps {
  invoices: Invoice[];
  showOnlyPaid?: boolean;
}

export function RevenueAllocationChart({ invoices, showOnlyPaid = true }: RevenueAllocationChartProps) {
  const { allocationData, totalRevenue } = useAllocationChartData(invoices, showOnlyPaid);

  if (!allocationData.length) {
    return (
      <Card className="w-full h-80">
        <CardHeader>
          <CardTitle>Revenue Allocation</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          {!invoices ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-muted-foreground">No revenue data available</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-80">
      <CardHeader>
        <CardTitle>
          Revenue Allocation {showOnlyPaid ? '(Paid Invoices)' : '(All Invoices)'}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ChartContainer
          config={Object.fromEntries(
            allocationData.map(({ name, color }) => [name, { label: name, color }])
          )}
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                content={({active, payload}) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const percentage = data.value / totalRevenue;
                    
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <div className="font-medium">{data.name}</div>
                        <div className="flex items-center justify-between gap-8 text-sm">
                          <span>Amount: </span>
                          <span className="font-medium">{formatCurrency(data.value)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-8 text-sm">
                          <span>Percentage: </span>
                          <span className="font-medium">{formatPercentage(percentage)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
