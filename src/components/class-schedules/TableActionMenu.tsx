
import { Edit, Trash, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { ClassSchedule } from "./types/classSchedule";

interface TableActionMenuProps {
  schedule: ClassSchedule;
  onEdit: (schedule: ClassSchedule) => void;
  onDelete: (id: string) => void;
}

export function TableActionMenu({ schedule, onEdit, onDelete }: TableActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit(schedule)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.location.href = `/bookings/${schedule.id}`}>
          <Users className="mr-2 h-4 w-4" />
          Manage Handlers
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-destructive"
          onClick={() => onDelete(schedule.id)}
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
