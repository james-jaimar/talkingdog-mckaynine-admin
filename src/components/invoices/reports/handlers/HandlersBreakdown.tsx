
import { formatCurrency } from "@/lib/formatters";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";
import { getHandlerCommissions } from "../utils/getHandlerCommissions";

interface HandlersBreakdownProps {
  classDetail: TrainerClassDetail;
}

export function HandlersBreakdown({ classDetail }: HandlersBreakdownProps) {
  const handlerData = getHandlerCommissions([classDetail]);
  
  return (
    <div className="col-span-7 mt-2 mb-2 border-t pt-2">
      <span className="font-medium mb-1 block">Handlers in this class</span>
      <div className="space-y-2">
        {handlerData.map((handler, i) => (
          <div key={i} className="flex justify-between rounded bg-muted px-3 py-2">
            <span className="font-medium">{handler.name}</span>
            <span className="text-right">{formatCurrency(handler.totalCommission)}</span>
          </div>
        ))}
        {handlerData.length === 0 && (
          <div className="text-muted-foreground italic col-span-2">No handler commission data available</div>
        )}
      </div>
    </div>
  );
}
