
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

interface ExpenseBreakdownCardsProps {
  totalAdmin: number;
  totalTrainer: number;
  totalFranchise: number;
  totalRevenue: number;
}

export function ExpenseBreakdownCards({
  totalAdmin,
  totalTrainer,
  totalFranchise,
  totalRevenue,
}: ExpenseBreakdownCardsProps) {
  const safeTotal = totalRevenue > 0 ? totalRevenue : 1;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            Trainer Fee
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
    </div>
  );
}
