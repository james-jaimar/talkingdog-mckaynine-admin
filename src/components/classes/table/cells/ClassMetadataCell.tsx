
import { TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { ClassWithSchedules } from "../../hooks/types/class-with-schedules";

interface ClassMetadataCellProps {
  classItem: ClassWithSchedules;
}

export function ClassMetadataCell({ classItem }: ClassMetadataCellProps) {
  return (
    <TableCell>
      <div className="space-y-1">
        <div className="font-medium">{classItem.name}</div>
        <div className="text-sm text-muted-foreground">
          {classItem.description || "No description"}
        </div>
      </div>
    </TableCell>
  );
}
