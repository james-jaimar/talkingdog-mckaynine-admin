
import { Button } from "@/components/ui/button";
import { RefreshCw, Wrench } from "lucide-react";

interface ActionButtonsProps {
  onRefresh: () => void;
  onFixZeroAmounts: () => void;
  hasZeroAmountPayments: boolean;
  isProcessing: boolean;
}

export function ActionButtons({
  onRefresh,
  onFixZeroAmounts,
  hasZeroAmountPayments,
  isProcessing
}: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap justify-end mb-2 gap-2">
      <Button 
        variant="outline" 
        onClick={onRefresh} 
        size="sm"
        className="gap-2"
        disabled={isProcessing}
      >
        <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
        Refresh Data
      </Button>
      
      {hasZeroAmountPayments && (
        <Button 
          variant="outline" 
          onClick={onFixZeroAmounts}
          size="sm"
          className="gap-2 bg-amber-50 border-amber-300 hover:bg-amber-100"
          disabled={isProcessing}
        >
          <Wrench className="h-4 w-4" />
          Fix Zero Amount Payments
        </Button>
      )}
    </div>
  );
}
