
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

interface ExpenseBreakdownCardsProps {
  totalAdmin: number;
  totalTrainer: number; // Renamed from totalHandler
  totalFranchise: number;
  profit?: number;
  totalRevenue: number;
}

export function ExpenseBreakdownCards({
  totalAdmin,
  totalTrainer,
  totalFranchise,
  profit = 0,
  totalRevenue,
}: ExpenseBreakdownCardsProps) {
  // Only calculate percentages if there's revenue to avoid division by zero
  const safeTotal = totalRevenue || 1;
  const adminPercent = (totalAdmin / safeTotal) * 100;
  const trainerPercent = (totalTrainer / safeTotal) * 100;
  const franchisePercent = (totalFranchise / safeTotal) * 100;
  const profitPercent = (profit / safeTotal) * 100;

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
              ({formatPercentage(adminPercent / 100)} of revenue)
            </span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Trainer Fee
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(totalTrainer)}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              ({formatPercentage(trainerPercent / 100)} of revenue)
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
              ({formatPercentage(franchisePercent / 100)} of revenue)
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
              ({formatPercentage(profitPercent / 100)} of revenue)
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
