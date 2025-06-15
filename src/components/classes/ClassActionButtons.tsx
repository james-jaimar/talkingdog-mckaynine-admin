
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, CalendarRange, Users, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useDropdownState } from "@/hooks/useDropdownState";

interface ClassActionButtonsProps {
  classId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function ClassActionButtons({ classId, onEdit, onDelete }: ClassActionButtonsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOpen, setIsOpen, onClose } = useDropdownState();

  const handleSchedulesClick = () => {
    navigate(`/classes/${classId}/schedules`);
    onClose();
  };

  const handleHandlersClick = () => {
    navigate(`/class/${classId}/handlers`);
    onClose();
  };

  const handleEditClick = () => {
    onEdit();
    onClose();
  };

  const handleDeleteClick = () => {
    onDelete();
    onClose();
  };

  return (
    <div className="flex items-center">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleEditClick}
        disabled={!user}
        title="Edit class"
      >
        <Edit className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleSchedulesClick}
        title="View schedules"
      >
        <CalendarRange className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleHandlersClick}
        title="View handlers"
      >
        <Users className="h-4 w-4" />
      </Button>
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background z-50">
          <DropdownMenuItem onClick={handleSchedulesClick}>
            View Schedules
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleHandlersClick}>
            View Handlers
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEditClick}>
            Edit Class
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDeleteClick}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Class
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
