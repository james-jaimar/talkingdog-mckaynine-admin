
import { cn } from "@/lib/utils";
import { Draggable } from "react-beautiful-dnd";
import { TabsTrigger } from "@/components/ui/tabs";
import { GripVertical } from "lucide-react";

interface ClassTabProps {
  classItem: {
    id: string;
    name: string;
  };
  index: number;
  isActive: boolean;
  onTabClick: (tabValue: string, path: string) => void;
}

export function ClassTab({ classItem, index, isActive, onTabClick }: ClassTabProps) {
  return (
    <Draggable 
      key={classItem.id} 
      draggableId={classItem.id} 
      index={index}
    >
      {(provided) => (
        <TabsTrigger 
          value={classItem.id} 
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={() => onTabClick(classItem.id, `/classes/${classItem.id}/handlers`)}
          className={cn(
            "flex items-center gap-1",
            isActive ? "font-medium" : ""
          )}
        >
          <div 
            {...provided.dragHandleProps}
            className="cursor-grab px-1"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          {classItem.name}
        </TabsTrigger>
      )}
    </Draggable>
  );
}
