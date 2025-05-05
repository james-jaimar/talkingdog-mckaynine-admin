
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

interface ExpenseBreakdownCardsProps {
  totalAdmin: number;
  totalTrainer: number;
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
  // Use a safe denominator to avoid division by zero
  const safeTotal = totalRevenue > 0 ? totalRevenue : 1;
  
  // Calculate displayed percentages based on actual values with proper rounding
  const adminPercent = (totalAdmin / safeTotal) * 100;
  const trainerPercent = (totalTrainer / safeTotal) * 100;
  const franchisePercent = (totalFranchise / safeTotal) * 100;
  const profitPercent = (profit / safeTotal) * 100;

  // Round to 2 decimal places for all monetary calculations
  const roundedAdmin = parseFloat(totalAdmin.toFixed(2));
  const roundedTrainer = parseFloat(totalTrainer.toFixed(2));
  const roundedFranchise = parseFloat(totalFranchise.toFixed(2));
  const roundedProfit = parseFloat(profit.toFixed(2));
  const roundedRevenue = parseFloat(totalRevenue.toFixed(2));

  // Validate the percentages add up to approximately 100%
  const totalPercent = adminPercent + trainerPercent + franchisePercent + profitPercent;
  if (Math.abs(100 - totalPercent) > 0.1 && totalRevenue > 0) {
    console.warn(
      `Warning: Expense percentages don't add up to 100%. ` +
      `Total: ${totalPercent.toFixed(2)}%, Difference: ${(100 - totalPercent).toFixed(2)}%`
    );
    // Also verify component total matches revenue total
    const componentTotal = roundedAdmin + roundedTrainer + roundedFranchise + roundedProfit;
    if (Math.abs(componentTotal - roundedRevenue) > 0.01) {
      console.warn(
        `Warning: Sum of expense components (${componentTotal}) doesn't match total revenue (${roundedRevenue}). ` +
        `Difference: ${(roundedRevenue - componentTotal).toFixed(2)}`
      );
    }
  }

  // Debug values to console
  console.log("ExpenseBreakdownCards values:", {
    totalAdmin: roundedAdmin, 
    totalTrainer: roundedTrainer, 
    totalFranchise: roundedFranchise, 
    profit: roundedProfit,
    totalRevenue: roundedRevenue,
    componentTotal: (roundedAdmin + roundedTrainer + roundedFranchise + roundedProfit),
    adminPercent: adminPercent.toFixed(1) + '%',
    trainerPercent: trainerPercent.toFixed(1) + '%',
    franchisePercent: franchisePercent.toFixed(1) + '%',
    profitPercent: profitPercent.toFixed(1) + '%',
    totalPercent: totalPercent.toFixed(1) + '%'
  });

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
              {formatCurrency(roundedAdmin)}
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
              {formatCurrency(roundedTrainer)}
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
              {formatCurrency(roundedFranchise)}
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
              {formatCurrency(roundedProfit)}
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
