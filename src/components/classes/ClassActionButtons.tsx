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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCurrentTermString } from "./utils/getCurrentTermString";
import { useMarkHandlersCompleted } from "./hooks/useMarkHandlersCompleted";
import { useTerm } from "@/context/TermContext";
import { ClosedBadge } from "./ClosedBadge";

interface ClassActionButtonsProps {
  classId: string;
  onEdit: () => void;
  onDelete: () => void;
  isClosed?: boolean; // new
}

export function ClassActionButtons({ classId, onEdit, onDelete, isClosed = false }: ClassActionButtonsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOpen, setIsOpen, onClose } = useDropdownState();
  const [closeDialogOpen, setCloseDialogOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const { toast } = useToast();
  const { termData } = useTerm();

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
    setCloseDialogOpen(true);
    onClose();
  };

  const handleConfirmCloseClass = async () => {
    setIsClosing(true);

    // 1. Call supabase to update the status to "closed"
    const { error } = await supabase
      .from("classes")
      .update({ status: "closed" })
      .eq("id", classId);

    if (error) {
      toast({
        title: "Failed to close class",
        description: error.message,
        variant: "destructive",
      });
      setIsClosing(false);
      setCloseDialogOpen(false);
      return;
    }

    // 2. Prepare currentTerm string and class type safely
    const currentTerm = getCurrentTermString(termData);

    // 3. Get classType safely
    let classType = "";
    if (termData && typeof termData === "object" && "term_number" in termData && "year" in termData) {
      // Fetch the class type from supabase for this class, fallback to ""
      const { data: classData } = await supabase
        .from("classes")
        .select("class_type")
        .eq("id", classId)
        .maybeSingle();
      classType = classData?.class_type || "";
    }

    // 4. Mark all enrolled handlers as completed for this class
    try {
      const completedCount = await useMarkHandlersCompleted(classId, currentTerm, classType);
      toast({
        title: "Class closed",
        description:
          `This class is now marked as closed. ${completedCount} handler(s) marked as completed for this class. Handler completion is now visible in the handlers table, and will enable future certificate/comms features.`,
      });
    } catch (handlerErr) {
      toast({
        title: "Some handler completions failed",
        description: String(handlerErr),
        variant: "destructive",
      });
    }

    setIsClosing(false);
    setCloseDialogOpen(false);
  };

  // For closed classes, disable or visually inform user
  return (
    <div className="flex items-center gap-1">
      {isClosed && (
        <ClosedBadge />
      )}

      {/* Disable most actions if closed */}
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
              <DropdownMenuItem 
                onClick={handleCloseClassClick}
              >
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
      {/* Close Class Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close this Class?</DialogTitle>
            <DialogDescription>
              Closing a class will prevent any new enrollments or changes. Existing handlers can be managed in the handlers tab. This action is reversible by an admin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCloseDialogOpen(false)}
              disabled={isClosing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCloseClass}
              disabled={isClosing}
            >
              {isClosing ? "Closing..." : "Close Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
