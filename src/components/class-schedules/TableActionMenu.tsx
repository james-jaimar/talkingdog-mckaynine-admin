
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
import { useDropdownState } from "@/hooks/useDropdownState";
import { useNavigate } from "react-router-dom";

interface TableActionMenuProps {
  schedule: ClassSchedule;
  onEdit: (schedule: ClassSchedule) => void;
  onDelete: (id: string) => void;
}

export function TableActionMenu({ schedule, onEdit, onDelete }: TableActionMenuProps) {
  const { isOpen, setIsOpen, onClose } = useDropdownState();
  const navigate = useNavigate();

  const handleEdit = () => {
    onEdit(schedule);
    onClose();
  };

  const handleDelete = () => {
    onDelete(schedule.id);
    onClose();
  };

  const handleManageHandlers = () => {
    navigate(`/bookings/${schedule.id}`);
    onClose();
  };
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleManageHandlers}>
          <Users className="mr-2 h-4 w-4" />
          Manage Handlers
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-destructive"
          onClick={handleDelete}
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
