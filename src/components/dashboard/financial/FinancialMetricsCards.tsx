
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, Users } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

interface FinancialMetrics {
  totalRevenue: number;
  collectedRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
}

interface FinancialMetricsCardsProps {
  metrics: FinancialMetrics;
}

export function FinancialMetricsCards({ metrics }: FinancialMetricsCardsProps) {
  // Always use totalRevenue as the denominator for percentage calculations
  // Safety check to avoid division by zero
  const totalForPercentage = metrics.totalRevenue > 0 ? metrics.totalRevenue : 1;
    
  const collectedPercentage = metrics.collectedRevenue / totalForPercentage;
  const pendingPercentage = metrics.pendingRevenue / totalForPercentage;
  const overduePercentage = metrics.overdueRevenue / totalForPercentage;

  // Add validation to log any discrepancies for debugging
  const sumOfComponents = metrics.collectedRevenue + metrics.pendingRevenue + metrics.overdueRevenue;
  const sumOfPercentages = collectedPercentage + pendingPercentage + overduePercentage;
  
  if (Math.abs(metrics.totalRevenue - sumOfComponents) > 0.01) {
    console.warn(
      `Warning: Revenue components don't add up to total revenue. ` +
      `Total: ${metrics.totalRevenue}, Sum of components: ${sumOfComponents}, ` +
      `Difference: ${metrics.totalRevenue - sumOfComponents}`
    );
  }
  
  if (Math.abs(1 - sumOfPercentages) > 0.01 && metrics.totalRevenue > 0) {
    console.warn(
      `Warning: Revenue percentages don't add up to 100%. ` +
      `Sum of percentages: ${sumOfPercentages * 100}%, ` +
      `Difference: ${(1 - sumOfPercentages) * 100}%`
    );
  }

  // Log metrics for debugging
  console.log("Financial metrics for cards:", metrics);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
            <span className="text-2xl font-bold">
              {formatCurrency(metrics.totalRevenue)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Active invoices (sent, paid, overdue)
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Collected Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-2xl font-bold text-green-500">
              {formatCurrency(metrics.collectedRevenue)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatPercentage(collectedPercentage)} of total revenue
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-amber-500 mr-2" />
            <span className="text-2xl font-bold text-amber-500">
              {formatCurrency(metrics.pendingRevenue)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatPercentage(pendingPercentage)} of total revenue
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Overdue Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Users className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-2xl font-bold text-red-500">
              {formatCurrency(metrics.overdueRevenue)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatPercentage(overduePercentage)} of total revenue
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
