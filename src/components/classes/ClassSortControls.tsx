
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ClassSortControlsProps {
  index: number;
  totalClasses: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ClassSortControls({ 
  index, 
  totalClasses, 
  onMoveUp, 
  onMoveDown 
}: ClassSortControlsProps) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-1">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7" 
        onClick={onMoveUp}
        disabled={index === 0 || !user}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7" 
        onClick={onMoveDown}
        disabled={index === totalClasses - 1 || !user}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
