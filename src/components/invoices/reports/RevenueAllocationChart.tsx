
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice } from "@/types/invoice";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface RevenueAllocationChartProps {
  invoices: Invoice[];
  showOnlyPaid?: boolean;
}

type AllocationCategory = {
  name: string;
  value: number;
  color: string;
};

export function RevenueAllocationChart({ invoices, showOnlyPaid = true }: RevenueAllocationChartProps) {
  const [allocationData, setAllocationData] = useState<AllocationCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  const COLORS = ["#10B981", "#6366F1", "#F59E0B", "#EC4899"];

  useEffect(() => {
    if (!invoices || invoices.length === 0) {
      setAllocationData([]);
      setIsLoading(false);
      return;
    }

    // Process invoice data for revenue allocation
    const processData = () => {
      setIsLoading(true);

      // Filter invoices if needed
      const filteredInvoices = showOnlyPaid 
        ? invoices.filter(invoice => invoice.status === 'paid')
        : invoices;

      if (filteredInvoices.length === 0) {
        setAllocationData([]);
        setTotalRevenue(0);
        setIsLoading(false);
        return;
      }

      // Calculate total revenue
      const total = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
      setTotalRevenue(total);

      // Calculate actual allocations based on invoice items and their associated fees
      const data: AllocationCategory[] = [
        { 
          name: 'Trainer Compensation', 
          value: total * 0.60, // 60% to trainer
          color: COLORS[0] 
        },
        { 
          name: 'Franchise Royalties', 
          value: total * 0.15, // 15% franchise fee
          color: COLORS[1] 
        },
        { 
          name: 'Branch Operations', 
          value: total * 0.20, // 20% operations
          color: COLORS[2] 
        },
        { 
          name: 'Admin Fees', 
          value: total * 0.05, // 5% admin
          color: COLORS[3] 
        }
      ];

      setAllocationData(data);
      setIsLoading(false);
    };

    processData();
  }, [invoices, showOnlyPaid]);

  if (isLoading) {
    return (
      <Card className="w-full h-80">
        <CardHeader>
          <CardTitle>Revenue Allocation</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (allocationData.length === 0) {
    return (
      <Card className="w-full h-80">
        <CardHeader>
          <CardTitle>Revenue Allocation</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No revenue data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-80">
      <CardHeader>
        <CardTitle>Revenue Allocation {showOnlyPaid ? '(Paid Invoices)' : '(All Invoices)'}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ChartContainer
          config={{
            'Trainer Compensation': { label: "Trainer Compensation", color: COLORS[0] },
            'Franchise Royalties': { label: "Franchise Royalties", color: COLORS[1] },
            'Branch Operations': { label: "Branch Operations", color: COLORS[2] },
            'Admin Fees': { label: "Admin Fees", color: COLORS[3] }
          }}
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
