
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, CalendarRange, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditClassModal } from "./EditClassModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth";

interface ClassActionButtonsProps {
  classId: string;
  onEdit: () => void;
}

export function ClassActionButtons({ classId, onEdit }: ClassActionButtonsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleSchedulesClick = () => {
    navigate(`/class-schedules?classId=${classId}`);
  };
  
  const handleHandlersClick = () => {
    navigate(`/class/${classId}/handlers`);
  };

  return (
    <div className="flex items-center">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => onEdit()}
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
      
      <DropdownMenu>
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
          <DropdownMenuItem onClick={() => onEdit()}>
            Edit Class
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
