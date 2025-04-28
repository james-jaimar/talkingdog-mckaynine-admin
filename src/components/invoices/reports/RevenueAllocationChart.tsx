
import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Sector, Tooltip 
} from "recharts";
import { Invoice } from "@/hooks/invoices/types";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RevenueAllocationProps {
  invoices: Invoice[];
  showOnlyPaid?: boolean;
}

export function RevenueAllocationChart({ invoices, showOnlyPaid = false }: RevenueAllocationProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const COLORS = ['#00C49F', '#3B82F6', '#FFBB28', '#8884d8'];
  
  // Generate chart data from invoices
  const { chartData, activeItems, totalRevenue } = useMemo(() => {
    // Filter to only paid invoices if requested
    const filteredInvoices = showOnlyPaid 
      ? invoices.filter(invoice => invoice.status === 'paid')
      : invoices;
    
    const total = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    
    // Default allocation percentages if no invoice data
    if (filteredInvoices.length === 0 || total === 0) {
      return {
        chartData: [
          { name: 'Admin Fee', value: 0 },
          { name: 'Trainer Fee', value: 0 },
          { name: 'Franchise Fee', value: 0 },
          { name: 'Profit', value: 0 }
        ],
        activeItems: 0,
        totalRevenue: 0
      };
    }
    
    // Process each invoice to calculate fees
    let adminFee = 0;
    let trainerFee = 0;
    let franchiseFee = 0;
    
    // Calculate fees for each invoice
    filteredInvoices.forEach(invoice => {
      if (!invoice.items || invoice.items.length === 0) {
        return;
      }
      
      // Process each invoice item
      invoice.items.forEach(item => {
        // Get the amount for this item
        const amount = item.amount || 0;
        
        if (item.bookings && item.bookings.class_schedules && item.bookings.class_schedules.classes) {
          const classInfo = item.bookings.class_schedules.classes;
          
          // Calculate admin fee
          if (classInfo.admin_fee_type === 'percentage') {
            adminFee += amount * ((classInfo.admin_fee_value || 0) / 100);
          } else {
            adminFee += (classInfo.admin_fee_value || 0);
          }
          
          // Calculate trainer fee
          if (classInfo.trainer_fee_type === 'percentage') {
            trainerFee += amount * ((classInfo.trainer_fee_value || 0) / 100);
          } else {
            trainerFee += (classInfo.trainer_fee_value || 0);
          }
          
          // Calculate franchise fee
          if (classInfo.mckaynine_commission_type === 'percentage') {
            franchiseFee += amount * ((classInfo.mckaynine_commission_value || 0) / 100);
          } else {
            franchiseFee += (classInfo.mckaynine_commission_value || 0);
          }
        } else {
          // For items without bookings, use default fee structure
          adminFee += amount * 0.10; // Default 10% for admin
          trainerFee += amount * 0.40; // Default 40% for trainer
          franchiseFee += amount * 0.15; // Default 15% for franchise
        }
      });
    });
    
    // Ensure non-negative values
    adminFee = Math.max(0, adminFee);
    trainerFee = Math.max(0, trainerFee);
    franchiseFee = Math.max(0, franchiseFee);
    
    // Calculate profit (total minus all fees)
    const totalFees = adminFee + trainerFee + franchiseFee;
    const profit = total - totalFees;
    
    console.log("Chart allocation data:", {
      adminFee,
      trainerFee,
      franchiseFee,
      profit,
      totalRevenue: total
    });
    
    return {
      chartData: [
        { name: 'Admin Fee', value: adminFee },
        { name: 'Trainer Fee', value: trainerFee },
        { name: 'Franchise Fee', value: franchiseFee },
        { name: 'Profit', value: profit }
      ],
      activeItems: filteredInvoices.length,
      totalRevenue: total
    };
  }, [invoices, showOnlyPaid]);
  
  // Skip rendering if no revenue
  if (totalRevenue === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Allocation {showOnlyPaid ? '(Paid Invoices)' : ''}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Alert variant="warning" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No {showOnlyPaid ? 'paid ' : ''}invoice data available for revenue allocation analysis.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Function to render active sector with different radius
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, name, value } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={outerRadius + 15}
          outerRadius={outerRadius + 20}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = (data.value / totalRevenue) * 100;
      
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-semibold">{data.name}</p>
          <p>{formatCurrency(data.value)}</p>
          <p className="text-xs text-gray-500">
            {formatPercentage(percentage / 100)} of revenue
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Revenue Allocation {showOnlyPaid ? '(Paid Invoices)' : ''}
          <span className="text-xs text-muted-foreground ml-2">
            {activeItems} {activeItems === 1 ? 'invoice' : 'invoices'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={chartData}
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="grid grid-cols-2 gap-2 mt-4">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center">
              <div 
                className="w-3 h-3 mr-2 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm truncate">{item.name}: {formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
