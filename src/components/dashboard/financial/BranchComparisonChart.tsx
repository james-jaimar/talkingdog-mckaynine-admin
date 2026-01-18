
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { ChartContainer } from "@/components/ui/chart";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BranchData {
  id: string;
  name: string;
  value: number;
  color: string;
}

interface BranchComparisonChartProps {
  branchId?: string;
  timeframe: 'monthly' | 'quarterly' | 'yearly';
  dateRange: { from: Date; to?: Date };
  isLoading: boolean;
}

const COLORS = ["#10B981", "#6366F1", "#F59E0B", "#EC4899", "#8B5CF6", "#14B8A6", "#F472B6"];

export function BranchComparisonChart({ branchId, timeframe, dateRange, isLoading }: BranchComparisonChartProps) {
  const [data, setData] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    async function fetchBranchData() {
      setLoading(true);
      
      try {
        // Get all branches
        const { data: branches, error: branchError } = await supabase
          .from('branches')
          .select('id, name');
        
        if (branchError) {
          console.error("Error fetching branches:", branchError);
          setLoading(false);
          return;
        }
        
        // Format date range for query
        const fromDate = dateRange.from.toISOString();
        const toDate = (dateRange.to || dateRange.from).toISOString();
        
        // Get revenue for each branch within date range
        // Now using invoice.branch_id directly instead of joining to clients
        const branchData = await Promise.all(branches.map(async (branch, index) => {
          const { data: invoices, error: invoiceError } = await supabase
            .from('invoices')
            .select(`
              id, 
              total,
              status,
              issued_date,
              branch_id
            `)
            .eq('branch_id', branch.id)
            .gte('issued_date', fromDate)
            .lte('issued_date', toDate)
            .eq('status', 'paid');
            
          if (invoiceError) {
            console.error(`Error fetching invoices for branch ${branch.name}:`, invoiceError);
            return {
              id: branch.id,
              name: branch.name,
              value: 0,
              color: COLORS[index % COLORS.length]
            };
          }
          
          const branchRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
          
          return {
            id: branch.id,
            name: branch.name,
            value: branchRevenue,
            color: COLORS[index % COLORS.length]
          };
        }));
        
        // Calculate total value
        const total = branchData.reduce((sum, branch) => sum + branch.value, 0);
        setTotalValue(total);
        
        // Filter out branches with no revenue
        const filteredData = branchData.filter(branch => branch.value > 0);
        
        setData(filteredData);
      } catch (error) {
        console.error("Error in branch comparison data fetch:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBranchData();
  }, [branchId, timeframe, dateRange]);

  if (loading || isLoading) {
    return (
      <Card className="w-full h-96">
        <CardHeader>
          <CardTitle>Branch Revenue Comparison</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="w-full h-96">
        <CardHeader>
          <CardTitle>Branch Revenue Comparison</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <p className="text-muted-foreground">No revenue data available for the selected period</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-96">
      <CardHeader>
        <CardTitle>Branch Revenue Comparison</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ChartContainer
          config={Object.fromEntries(
            data.map(({ name, color }) => [name, { label: name, color }])
          )}
          className="h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                content={({active, payload}) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const percentage = data.value / totalValue;
                    
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <div className="font-medium">{data.name}</div>
                        <div className="flex items-center justify-between gap-8 text-sm">
                          <span>Revenue: </span>
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
