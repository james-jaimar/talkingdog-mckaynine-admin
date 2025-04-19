
import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Invoice } from "@/hooks/invoices/types";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DollarSign, TrendingUp, Calendar, Users } from "lucide-react";
import { format, isWithinInterval } from "date-fns";

interface RevenueBreakdownCardProps {
  invoices: Invoice[];
  dateRange: { from: Date; to?: Date };
  isLoading: boolean;
}

export function RevenueBreakdownCard({ invoices, dateRange, isLoading }: RevenueBreakdownCardProps) {
  const { 
    totalRevenue, 
    collectedRevenue, 
    pendingRevenue, 
    overdueRevenue,
    percentages
  } = useMemo(() => {
    // Filter invoices by date range
    const filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.issued_date);
      const endDate = dateRange.to || dateRange.from;
      
      return isWithinInterval(invoiceDate, {
        start: dateRange.from,
        end: endDate
      });
    });
    
    // Calculate revenue metrics
    const total = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const collected = filteredInvoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0);
    const pending = filteredInvoices
      .filter(invoice => invoice.status === 'sent')
      .reduce((sum, invoice) => sum + invoice.total, 0);
    const overdue = filteredInvoices
      .filter(invoice => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + invoice.total, 0);
    
    // Fix: Use the total revenue directly as the base for percentage calculations
    // to ensure percentages accurately reflect proportion of the total
    const totalForPercentage = total > 0 ? total : 1;
    
    // Log a warning if there's a discrepancy between total and sum of components
    const sumOfComponents = collected + pending + overdue;
    if (Math.abs(total - sumOfComponents) > 0.01) {
      console.warn(
        `Warning: Revenue components don't add up to total revenue. ` +
        `Total: ${total}, Sum of components: ${sumOfComponents}, ` +
        `Difference: ${total - sumOfComponents}`
      );
    }
    
    return {
      totalRevenue: total,
      collectedRevenue: collected,
      pendingRevenue: pending,
      overdueRevenue: overdue,
      percentages: {
        collected: total > 0 ? collected / totalForPercentage : 0,
        pending: total > 0 ? pending / totalForPercentage : 0,
        overdue: total > 0 ? overdue / totalForPercentage : 0
      }
    };
  }, [invoices, dateRange]);

  // Format date range for display
  const dateRangeDisplay = dateRange.to 
    ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
    : format(dateRange.from, "MMM d, yyyy");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Total Revenue"
        value={formatCurrency(totalRevenue)}
        icon={DollarSign}
        description={`Period: ${dateRangeDisplay}`}
      />
      
      <StatsCard
        title="Collected Revenue"
        value={formatCurrency(collectedRevenue)}
        icon={TrendingUp}
        description={`${formatPercentage(percentages.collected)} of total revenue`}
        className="border-l-4 border-green-500"
      />
      
      <StatsCard
        title="Pending Revenue"
        value={formatCurrency(pendingRevenue)}
        icon={Calendar}
        description={`${formatPercentage(percentages.pending)} of total revenue`}
        className="border-l-4 border-amber-500"
      />
      
      <StatsCard
        title="Overdue Revenue"
        value={formatCurrency(overdueRevenue)}
        icon={Users}
        description={`${formatPercentage(percentages.overdue)} of total revenue`}
        className="border-l-4 border-red-500"
      />
    </div>
  );
}
