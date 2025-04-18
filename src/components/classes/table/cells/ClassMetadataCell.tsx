
import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";

interface ClassMetadataCellProps {
  duration: number;
  courseFee: number;
  capacity: number;
  branchName?: string;
}

export function ClassMetadataCell({ duration, courseFee, capacity, branchName }: ClassMetadataCellProps) {
  return (
    <>
      <TableCell>
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{duration} min</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <span>R {courseFee}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{capacity} dogs</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{branchName || 'Unknown'}</span>
        </div>
      </TableCell>
    </>
  );
}
