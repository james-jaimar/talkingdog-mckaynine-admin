
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/auth";

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
  const { user } = useAuth();
  
  const handleMoveUp = () => {
    // Pass the current index to the parent handler
    onMoveUp(index);
  };
  
  const handleMoveDown = () => {
    // Pass the current index to the parent handler
    onMoveDown(index);
  };

  return (
    <div className="flex flex-col gap-1">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7" 
        onClick={handleMoveUp}
        disabled={index === 0 || !user}
        title="Move up"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7" 
        onClick={handleMoveDown}
        disabled={index === totalClasses - 1 || !user}
        title="Move down"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
