
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { UserRound } from "lucide-react";

interface TrainerPaymentSummaryProps {
  trainerName: string;
  paymentCount: number;
  totalAmount: number;
}

export function TrainerPaymentSummary({
  trainerName,
  paymentCount,
  totalAmount
}: TrainerPaymentSummaryProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UserRound className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium">{trainerName}</h3>
            <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
              <div>{paymentCount} payment{paymentCount !== 1 ? 's' : ''}</div>
              <div>{formatCurrency(totalAmount)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
