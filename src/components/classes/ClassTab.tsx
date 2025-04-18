
import { cn } from "@/lib/utils";
import { TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

interface ClassTabProps {
  classItem: {
    id: string;
    name: string;
  };
  index: number;
  isActive: boolean;
  onTabClick?: (tabValue: string, path: string) => void;
}

export function ClassTab({ classItem, index, isActive, onTabClick }: ClassTabProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    const path = `/class/${classItem.id}/handlers`;
    if (onTabClick) {
      onTabClick(classItem.id, path);
    } else {
      navigate(path);
    }
  };
  
  return (
    <TabsTrigger 
      value={classItem.id}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors",
        isActive 
          ? "bg-white text-mckaynine-600 shadow-sm" 
          : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
      )}
    >
      {classItem.name}
    </TabsTrigger>
  );
}
