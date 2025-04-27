
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

interface ExpenseBreakdownCardsProps {
  totalAdmin: number;
  totalTrainer: number; // Will display as Handler Fee
  totalFranchise: number;
  profit?: number; // Added profit property
  totalRevenue: number;
}

export function ExpenseBreakdownCards({
  totalAdmin,
  totalTrainer,
  totalFranchise,
  profit = 0, // Default to 0 if not provided
  totalRevenue,
}: ExpenseBreakdownCardsProps) {
  const safeTotal = totalRevenue > 0 ? totalRevenue : 1;
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Admin Fee
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalAdmin)}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              ({formatPercentage(totalAdmin / safeTotal)} of revenue)
            </span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Handler Fee
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(totalTrainer)}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              ({formatPercentage(totalTrainer / safeTotal)} of revenue)
            </span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Franchise Fee
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-amber-600">
              {formatCurrency(totalFranchise)}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              ({formatPercentage(totalFranchise / safeTotal)} of revenue)
            </span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Profit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-purple-600">
              {formatCurrency(profit)}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              ({formatPercentage(profit / safeTotal)} of revenue)
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
