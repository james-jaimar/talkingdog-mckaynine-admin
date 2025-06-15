
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Calendar, Users, MoreHorizontal, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClassWithSchedules } from "./hooks/types/class-with-schedules";
import { ClassActionButtons } from "./ClassActionButtons";
import { ClassAvailabilityBadge } from "./ClassAvailabilityBadge";
import clsx from "clsx";

interface ClassTableRowProps {
  classItem: ClassWithSchedules;
  index: number;
  totalClasses?: number;
  onEdit: (id: string) => void;
  isLoading?: boolean;
  isMoving?: boolean;
}

export function ClassTableRow({ classItem, index, totalClasses, onEdit, isLoading, isMoving }: ClassTableRowProps) {
  const navigate = useNavigate();

  const {
    id,
    name,
    class_type,
    capacity,
    duration,
    course_fee,
    branch_id,
    status,
    class_schedules,
  } = classItem;

  // Calculate total handlers (enrolled)
  const handlerCount =
    class_schedules?.reduce((acc, s) => acc + (Array.isArray(s.bookings) ? s.bookings.length : 0), 0) || 0;

  // Display slot badge
  const slotsLeft = capacity - handlerCount;
  
  // Color striping for alternate rows
  const isStriped = index % 2 === 1;
  
  // Show only icon actions in action column
  return (
    <tr className={clsx(isStriped ? "bg-blue-50" : "bg-white", isMoving && "opacity-50")}>
      {/* Drag handle cell: could be rendered, if supported by drag lib, e.g. a grippy icon */}
      <td className="pl-4">{/* Optionally add drag handle icon here if needed */}</td>
      <td className="font-medium">{name}</td>
      <td>
        <Badge>{class_type}</Badge>
      </td>
      <td>{duration} min</td>
      <td>
        R {Number(course_fee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td>{capacity}</td>
      {/* Replace with branch/location display here if desired */}
      <td>{"Delta"}</td>
      <td>
        <ClassAvailabilityBadge classItem={classItem} />
        <div className="text-xs text-muted-foreground">{handlerCount} handler{handlerCount !== 1 ? "s" : ""}</div>
      </td>
      {/* Actions */}
      <td className="flex gap-2 items-center">
        <Button
          variant="ghost"
          className="p-2"
          onClick={() => onEdit(id)}
          title="Edit class"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          className="p-2"
          onClick={() => navigate(`/class-schedules?classId=${id}`)}
          title="View schedules"
        >
          <Calendar className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          className="p-2"
          onClick={() => navigate(`/class-handlers?classId=${id}`)}
          title="View handlers"
        >
          <Users className="w-4 h-4" />
        </Button>
        {/* ...Extra actions dropdown if needed */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-2">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-40 bg-white">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(id)}>
              <Edit className="mr-2 w-4 h-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/class-schedules?classId=${id}`)}>
              <Calendar className="mr-2 w-4 h-4" />
              View Schedules
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/class-handlers?classId=${id}`)}>
              <Users className="mr-2 w-4 h-4" />
              View Handlers
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {status === "closed" ? (
              <DropdownMenuItem className="text-green-600">
                <CheckCircle className="mr-2 w-4 h-4" /> Closed
              </DropdownMenuItem>
            ) : (
              <ClassActionButtons classId={id} classStatus={status ?? "open"} />
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Subtle "Close Class" icon (only if open) */}
        {status === "open" && (
          <span>
            <ClassActionButtons classId={id} classStatus={status ?? "open"} />
          </span>
        )}
        {status === "closed" && (
          <span className="text-xs px-2 py-0.5 rounded bg-green-200 text-green-800 flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" /> Closed
          </span>
        )}
      </td>
    </tr>
  );
}
