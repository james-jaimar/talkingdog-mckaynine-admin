
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

interface RevenueAllocationChartProps {
  fees: {
    adminFee: number;
    trainerFee: number;
    franchiseFee: number;
    profit: number;
  };
  totalRevenue: number;
  courseFeeRevenue?: number;
  enrollmentFeeRevenue?: number;
  showOnlyPaid?: boolean;
}

export function RevenueAllocationChart({ 
  fees, 
  totalRevenue,
  courseFeeRevenue,
  enrollmentFeeRevenue = 0,
  showOnlyPaid = false 
}: RevenueAllocationChartProps) {
  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];
  
  // Use course fee revenue for percentage calculations if provided, otherwise fall back to total
  const baseForCalculations = courseFeeRevenue ?? totalRevenue;
  
  // Safely calculate percentages to avoid division by zero - using course fee revenue as base
  const safeTotal = baseForCalculations || 1;
  const adminPercent = (fees.adminFee / safeTotal) * 100;
  const trainerPercent = (fees.trainerFee / safeTotal) * 100;
  const franchisePercent = (fees.franchiseFee / safeTotal) * 100;
  const profitPercent = (fees.profit / safeTotal) * 100;
  
  // Create data for pie chart
  const data = [
    { name: 'Admin Fee', value: fees.adminFee, percent: adminPercent },
    { name: 'Trainer Fee', value: fees.trainerFee, percent: trainerPercent },
    { name: 'Franchise Fee', value: fees.franchiseFee, percent: franchisePercent },
    { name: 'Profit', value: fees.profit, percent: profitPercent },
  ];
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-semibold">{item.name}</p>
          <p>{formatCurrency(item.value)}</p>
          <p>{formatPercentage(item.percent / 100)} of course fees</p>
        </div>
      );
    }
    return null;
  };
  
  // Format the renderer for the legend
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <ul className="flex flex-wrap justify-center gap-4 text-xs">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center gap-1">
            <span className="w-3 h-3 inline-block" style={{ backgroundColor: entry.color }}></span>
            <span>{entry.value}: {formatPercentage(data[index].percent / 100)}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-center space-y-1">
          <p className="text-sm text-muted-foreground">
            Course Fee Revenue: <span className="font-medium">{formatCurrency(baseForCalculations)}</span>
            {showOnlyPaid && " (paid invoices only)"}
          </p>
          {enrollmentFeeRevenue > 0 && (
            <p className="text-xs text-muted-foreground">
              + Enrollment Fees: <span className="font-medium">{formatCurrency(enrollmentFeeRevenue)}</span>
              <span className="italic ml-1">(pass-through, not included in allocation)</span>
            </p>
          )}
        </div>
        
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
