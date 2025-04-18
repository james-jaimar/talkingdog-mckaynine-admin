
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, CalendarRange, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useDropdownState } from "@/hooks/useDropdownState";

interface ClassActionButtonsProps {
  classId: string;
  onEdit: () => void;
}

export function ClassActionButtons({ classId, onEdit }: ClassActionButtonsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOpen, setIsOpen } = useDropdownState();

  const handleSchedulesClick = () => {
    // Update to use the proper URL format that ClassSchedules component expects
    navigate(`/classes/${classId}/schedules`);
    setIsOpen(false);
  };

  const handleHandlersClick = () => {
    navigate(`/class/${classId}/handlers`);
    setIsOpen(false);
  };

  const handleEditClick = () => {
    onEdit();
    setIsOpen(false);
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
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSchedulesClick}>
            View Schedules
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleHandlersClick}>
            View Handlers
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEditClick}>
            Edit Class
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
