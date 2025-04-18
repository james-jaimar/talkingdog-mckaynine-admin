
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

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
  const handleMoveUp = () => {
    if (!isLoading) {
      onMoveUp(index);
    }
  };
  
  const handleMoveDown = () => {
    if (!isLoading) {
      onMoveDown(index);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7" 
        onClick={handleMoveUp}
        disabled={index === 0 || isLoading}
        title="Move up"
        aria-label="Move class up in order"
      >
        <ChevronUp className={`h-4 w-4 ${isLoading ? 'text-gray-400' : ''}`} />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7" 
        onClick={handleMoveDown}
        disabled={index === totalClasses - 1 || isLoading}
        title="Move down"
        aria-label="Move class down in order"
      >
        <ChevronDown className={`h-4 w-4 ${isLoading ? 'text-gray-400' : ''}`} />
      </Button>
    </div>
  );
}
