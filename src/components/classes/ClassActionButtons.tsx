import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, CalendarRange, Users, Trash2, CircleX } from "lucide-react";
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
import * as React from "react";
import { ClosedBadge } from "./ClosedBadge";
import { ClassClosureModal } from "./closure/ClassClosureModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ClassActionButtonsProps {
  classId: string;
  onEdit: () => void;
  onDelete: () => void;
  isClosed?: boolean;
}

export function ClassActionButtons({ classId, onEdit, onDelete, isClosed = false }: ClassActionButtonsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOpen, setIsOpen, onClose } = useDropdownState();
  const [closeModalOpen, setCloseModalOpen] = React.useState(false);

  // Fetch class info for the closure modal
  const { data: classInfo, refetch: refetchClass } = useQuery({
    queryKey: ["class-info-for-closure", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("name, class_type")
        .eq("id", classId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!classId
  });

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

  const handleCloseClassClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setCloseModalOpen(true);
    onClose();
  };

  const handleClassClosed = () => {
    refetchClass();
    // Trigger a page refresh to show updated status
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-1">
      {isClosed && <ClosedBadge />}

      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleEditClick}
        disabled={!user || isClosed}
        title={isClosed ? "Cannot edit a closed class" : "Edit class"}
      >
        <Edit className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleSchedulesClick}
        title="View schedules"
        disabled={isClosed}
      >
        <CalendarRange className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleHandlersClick}
        title="View handlers"
        disabled={isClosed}
      >
        <Users className="h-4 w-4" />
      </Button>
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isClosed}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background z-50">
          <DropdownMenuItem onClick={handleSchedulesClick} disabled={isClosed}>
            View Schedules
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleHandlersClick} disabled={isClosed}>
            View Handlers
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEditClick} disabled={isClosed}>
            Edit Class
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!isClosed && (
            <>
              <DropdownMenuItem onClick={handleCloseClassClick}>
                <CircleX className="h-4 w-4 mr-2" />
                Close Class
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDeleteClick}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Class
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* New Class Closure Modal with per-handler details */}
      <ClassClosureModal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        classId={classId}
        className={classInfo?.name || "Class"}
        classType={classInfo?.class_type || ""}
        onClassClosed={handleClassClosed}
      />
    </div>
  );
}
