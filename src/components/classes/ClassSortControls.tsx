
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";

interface ClassSortControlsProps {
  index: number;
  totalClasses: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isLoading?: boolean;
}

export function ClassSortControls({ 
  index, 
  totalClasses, 
  onMoveUp, 
  onMoveDown,
  isLoading = false
}: ClassSortControlsProps) {
  const handleMoveUp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      console.log(`ClassSortControls: Moving up index ${index}`);
      onMoveUp(index);
    }
  };
  
  const handleMoveDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      console.log(`ClassSortControls: Moving down index ${index}`);
      onMoveDown(index);
    }
  };

  return (
    <div className="flex flex-col gap-1 relative">
      {isLoading && (
        <div className="absolute -left-6 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}
      <Button 
        variant="ghost" 
        size="icon" 
        className={`h-7 w-7 transition-opacity ${isLoading ? 'opacity-50' : ''}`}
        onClick={handleMoveUp}
        disabled={index === 0 || isLoading}
        title="Move up"
        aria-label="Move class up in order"
        type="button"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className={`h-7 w-7 transition-opacity ${isLoading ? 'opacity-50' : ''}`}
        onClick={handleMoveDown}
        disabled={index === totalClasses - 1 || isLoading}
        title="Move down"
        aria-label="Move class down in order"
        type="button"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
