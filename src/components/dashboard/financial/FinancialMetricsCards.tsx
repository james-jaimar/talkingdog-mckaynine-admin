
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
  // Ensure we're calculating percentages against actual revenue
  // Note: We use direct calculation rather than relying on computed totals
  // to ensure the percentages add up to exactly 100%
  const revenueSum = metrics.collectedRevenue + metrics.pendingRevenue + metrics.overdueRevenue;
  
  // If there's a small discrepancy between totalRevenue and the sum of components,
  // use the sum to ensure percentages add to 100%
  const baseForPercentage = Math.abs(metrics.totalRevenue - revenueSum) < 0.01 
    ? metrics.totalRevenue 
    : revenueSum;
    
  const collectedPercentage = baseForPercentage > 0 
    ? metrics.collectedRevenue / baseForPercentage 
    : 0;
    
  const pendingPercentage = baseForPercentage > 0 
    ? metrics.pendingRevenue / baseForPercentage 
    : 0;
    
  const overduePercentage = baseForPercentage > 0 
    ? metrics.overdueRevenue / baseForPercentage 
    : 0;

  // Validation - ensure percentages sum to 1 (100%)
  // This is just a sanity check - if these values aren't very close to 1, 
  // something is wrong with our calculations
  const percentageSum = collectedPercentage + pendingPercentage + overduePercentage;
  
  // Log a warning if the percentages don't add up (with small tolerance for floating point)
  if (Math.abs(percentageSum - 1) > 0.001 && baseForPercentage > 0) {
    console.warn(
      `Warning: Revenue percentages don't add up to 100%. Sum: ${percentageSum * 100}%`,
      { collectedPercentage, pendingPercentage, overduePercentage }
    );
  }

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
            All time
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
