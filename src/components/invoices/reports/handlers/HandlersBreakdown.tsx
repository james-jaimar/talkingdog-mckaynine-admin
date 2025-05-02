
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { getHandlerCommissions } from "../utils/getHandlerCommissions";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";

interface HandlersBreakdownProps {
  classDetails: TrainerClassDetail[];
}

export function HandlersBreakdown({ classDetails }: HandlersBreakdownProps) {
  const handlersData = getHandlerCommissions(classDetails);
  
  if (handlersData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client Commission Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No client data available for this class
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Commission Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {handlersData.map((handler) => (
            <div key={handler.id} className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">{handler.name}</span>
              <span>{formatCurrency(handler.amount)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
