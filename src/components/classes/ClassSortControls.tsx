
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

interface ClassSortControlsProps {
  index: number;
  totalClasses: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function ClassSortControls({ 
  index, 
  totalClasses, 
  onMoveUp, 
  onMoveDown 
}: ClassSortControlsProps) {
  const handleMoveUp = () => {
    onMoveUp(index);
  };
  
  const handleMoveDown = () => {
    onMoveDown(index);
  };

  return (
    <div className="flex flex-col gap-1">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7" 
        onClick={handleMoveUp}
        disabled={index === 0}
        title="Move up"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7" 
        onClick={handleMoveDown}
        disabled={index === totalClasses - 1}
        title="Move down"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
