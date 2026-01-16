import { ClassWithSchedules } from "../hooks/types/class-with-schedules";
import { MobileClassCard } from "./MobileClassCard";

interface MobileClassesListProps {
  classes: ClassWithSchedules[];
  onEdit: (classItem: ClassWithSchedules) => void;
}

export function MobileClassesList({ classes, onEdit }: MobileClassesListProps) {
  if (!classes || classes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No classes found
      </div>
    );
  }

  // Sort: open classes first, closed at bottom
  const sortedClasses = [...classes].sort((a, b) => {
    if (a.status === "closed" && b.status !== "closed") return 1;
    if (b.status === "closed" && a.status !== "closed") return -1;
    return 0;
  });

  return (
    <div className="sm:hidden space-y-1">
      {sortedClasses.map((classItem) => (
        <MobileClassCard
          key={classItem.id}
          classItem={classItem}
          onEdit={() => onEdit(classItem)}
        />
      ))}
    </div>
  );
}
