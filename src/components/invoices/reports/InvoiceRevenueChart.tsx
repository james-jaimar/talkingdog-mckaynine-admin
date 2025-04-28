
import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Invoice } from "@/hooks/invoices/types";
import { useInvoices } from "@/hooks/useInvoices";
import { formatCurrency } from "@/lib/formatters";

interface InvoiceRevenueChartProps {
  invoices?: Invoice[];
  timeframe: 'monthly' | 'quarterly' | 'yearly';
}

export function InvoiceRevenueChart({
  invoices: propsInvoices,
  timeframe
}: InvoiceRevenueChartProps) {
  // If invoices aren't passed as props, fetch them
  const { invoices: fetchedInvoices } = useInvoices();
  const invoices = propsInvoices?.length ? propsInvoices : fetchedInvoices;
  
  // Filter only valid invoice statuses (sent, paid, overdue)
  const validInvoices = invoices?.filter(invoice => 
    invoice.status === 'sent' || invoice.status === 'paid' || invoice.status === 'overdue'
  ) || [];

  // Generate chart data based on timeframe
  const chartData = useMemo(() => {
    if (!validInvoices.length) return [];

    // Get the time range based on timeframe
    const now = new Date();
    let months = 6; // Default for monthly view
    
    if (timeframe === 'quarterly') {
      months = 12; // Show 4 quarters (12 months)
    } else if (timeframe === 'yearly') {
      months = 24; // Show 2 years
    }
    
    // Create an array of month data points
    const dataPoints = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(now, i);
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);
      
      // Monthly format is just the month name
      const monthLabel = format(date, 'MMM');
      
      // For quarterly, group by quarter
      const quarterLabel = timeframe === 'quarterly' 
        ? `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}` 
        : monthLabel;
        
      // For yearly, just show the year
      const yearLabel = timeframe === 'yearly' 
        ? date.getFullYear().toString() 
        : quarterLabel;
        
      // Choose the appropriate label based on timeframe
      const label = timeframe === 'monthly' 
        ? monthLabel 
        : timeframe === 'quarterly' 
          ? quarterLabel 
          : yearLabel;
      
      // Calculate revenue for this period
      const periodInvoices = validInvoices.filter(invoice => {
        const invoiceDate = new Date(invoice.issued_date);
        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
      
      const revenue = periodInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
      const paidRevenue = periodInvoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.total, 0);
      
      dataPoints.push({
        name: label,
        revenue,
        paidRevenue
      });
    }
    
    // For quarterly and yearly views, consolidate the data points
    if (timeframe !== 'monthly') {
      const consolidatedData = {};
      
      dataPoints.forEach(point => {
        if (!consolidatedData[point.name]) {
          consolidatedData[point.name] = {
            name: point.name,
            revenue: 0,
            paidRevenue: 0
          };
        }
        
        consolidatedData[point.name].revenue += point.revenue;
        consolidatedData[point.name].paidRevenue += point.paidRevenue;
      });
      
      return Object.values(consolidatedData);
    }
    
    return dataPoints;
  }, [validInvoices, timeframe]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-semibold">{label}</p>
          <p className="text-green-600">Total: {formatCurrency(payload[0].value)}</p>
          <p className="text-blue-600">Paid: {formatCurrency(payload[1].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis 
              tickFormatter={(value) => 
                value === 0 ? '0' : `R${(value / 1000).toFixed(0)}k`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stackId="1"
              stroke="#8884d8"
              fill="rgba(136, 132, 216, 0.6)"
              name="Total Revenue"
            />
            <Area
              type="monotone"
              dataKey="paidRevenue"
              stackId="2"
              stroke="#82ca9d"
              fill="rgba(130, 202, 157, 0.6)"
              name="Paid Revenue"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
