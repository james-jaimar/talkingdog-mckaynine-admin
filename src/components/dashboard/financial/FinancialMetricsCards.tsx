
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, TrendingUp, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface MetricsProps {
  totalRevenue: number;
  collectedRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  unallocatedRevenue?: number;
  unallocatedPercentage?: number;
}

export function FinancialMetricsCards({ 
  totalRevenue, 
  collectedRevenue, 
  pendingRevenue, 
  overdueRevenue,
  unallocatedRevenue = 0,
  unallocatedPercentage = 0
}: MetricsProps) {
  const navigate = useNavigate();

  const collectionRate = totalRevenue ? (collectedRevenue / totalRevenue) * 100 : 0;
  const hasUnallocatedRevenue = unallocatedRevenue > 0 && unallocatedPercentage > 5;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card className="relative">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          {hasUnallocatedRevenue && (
            <div className="mt-2 flex items-center text-xs text-amber-600 gap-1">
              <AlertCircle className="h-3 w-3" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="link" 
                      className="text-xs text-amber-600 h-auto p-0"
                      onClick={() => navigate('/financial-reports?tab=unallocated')}
                    >
                      {unallocatedPercentage.toFixed(1)}% unallocated
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      R{unallocatedRevenue.toFixed(2)} of revenue is not allocated to specific classes.
                      Click to view and fix unallocated invoices.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Collected Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(collectedRevenue)}</div>
          <p className="text-xs text-muted-foreground">{collectionRate.toFixed(1)}% collection rate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(pendingRevenue)}</div>
          <p className="text-xs text-muted-foreground">Sent but not paid</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Overdue Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(overdueRevenue)}</div>
          <p className="text-xs text-muted-foreground">Past due date</p>
        </CardContent>
      </Card>
    </div>
  );
}
