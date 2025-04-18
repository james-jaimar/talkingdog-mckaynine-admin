
import { TabsList } from "@/components/ui/tabs";
import { ClassTab } from "../ClassTab";
import { Class } from "../types/class";

interface ClassTabsListProps {
  classes: Class[];
  currentClassId: string | null;
  onTabClick: (tabValue: string, path: string) => void;
}

export function ClassTabsList({ classes, currentClassId, onTabClick }: ClassTabsListProps) {
  return (
    <TabsList className="w-max min-w-full justify-start h-auto bg-transparent">
      {classes.map((classItem, index) => (
        <ClassTab
          key={classItem.id}
          classItem={classItem}
          index={index}
          isActive={classItem.id === currentClassId}
          onTabClick={onTabClick}
        />
      ))}
    </TabsList>
  );
}
