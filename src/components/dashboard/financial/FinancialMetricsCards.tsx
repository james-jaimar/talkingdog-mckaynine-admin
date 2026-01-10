
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface MetricsProps {
  totalRevenue: number;
  collectedRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  enrollmentFees?: number; // Optional: enrollment fees collected (pass-through)
}

export function FinancialMetricsCards({ 
  totalRevenue, 
  collectedRevenue, 
  pendingRevenue, 
  overdueRevenue,
  enrollmentFees = 0
}: MetricsProps) {
  const collectionRate = totalRevenue ? (collectedRevenue / totalRevenue) * 100 : 0;
  
  // Custom currency formatter without dollar symbol
  const formatRandCurrency = (amount: number) => `R ${amount.toFixed(2)}`;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
      <Card className="relative">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatRandCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">Excl. enrollment fees</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Collected Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatRandCurrency(collectedRevenue)}</div>
          <p className="text-xs text-muted-foreground">{collectionRate.toFixed(1)}% collection rate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatRandCurrency(pendingRevenue)}</div>
          <p className="text-xs text-muted-foreground">Sent but not paid</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Overdue Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatRandCurrency(overdueRevenue)}</div>
          <p className="text-xs text-muted-foreground">Past due date</p>
        </CardContent>
      </Card>

      {enrollmentFees > 0 && (
        <Card className="bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enrollment Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{formatRandCurrency(enrollmentFees)}</div>
            <p className="text-xs text-muted-foreground">Pass-through to franchise</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
