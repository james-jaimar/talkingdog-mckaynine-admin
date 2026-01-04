import { Button } from "@/components/ui/button";
import { CheckSquare, Send, X, CreditCard } from "lucide-react";

interface BulkActionsToolbarProps {
  selectedCount: number;
  draftCount: number;
  unpaidCount: number;
  onMarkAsSent: () => void;
  onMarkAsPaid: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

export function BulkActionsToolbar({
  selectedCount,
  draftCount,
  unpaidCount,
  onMarkAsSent,
  onMarkAsPaid,
  onClearSelection,
  isLoading = false,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-md mb-3">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {selectedCount} invoice{selectedCount !== 1 ? 's' : ''} selected
          {draftCount > 0 && draftCount < selectedCount && (
            <span className="text-muted-foreground ml-1">
              ({draftCount} draft)
            </span>
          )}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onMarkAsSent}
          disabled={draftCount === 0 || isLoading}
          className="gap-1"
        >
          <Send className="h-3 w-3" />
          Mark as Sent {draftCount > 0 && `(${draftCount})`}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onMarkAsPaid}
          disabled={unpaidCount === 0 || isLoading}
          className="gap-1 text-green-600 border-green-600 hover:bg-green-50"
        >
          <CreditCard className="h-3 w-3" />
          Mark as Paid {unpaidCount > 0 && `(${unpaidCount})`}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="gap-1"
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      </div>
    </div>
  );
}
