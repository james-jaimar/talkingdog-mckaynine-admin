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

interface ClassActionButtonsProps {
  classId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function ClassActionButtons({ classId, onEdit, onDelete }: ClassActionButtonsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOpen, setIsOpen, onClose } = useDropdownState();
  const [closeDialogOpen, setCloseDialogOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const { toast } = useToast();

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

  // Utility: fetch enrolled handlers and mark as completed
  const markHandlersCompleted = async () => {
    // 1. Get enrolled bookings for this class
    const { data: classSchedulesData, error: classSchedulesError } = await supabase
      .from("class_schedules")
      .select("id")
      .eq("class_id", classId);

    const scheduleIds = classSchedulesData?.map(cs => cs.id) || [];

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, client_id")
      .eq("is_enrolled", true)
      .in("class_schedule_id", scheduleIds);

    if (bookingsError) throw bookingsError;
    if (!bookings || bookings.length === 0) return 0;

    // 2. Get class meta
    const { data: classData, error: classErr } = await supabase
      .from("classes")
      .select("id, class_type")
      .eq("id", classId)
      .maybeSingle();
    if (classErr) throw classErr;

    // 3. Get current term as text (optional, fallback to year)
    let currentTerm = "";
    const { data: termData } = await supabase
      .from("terms")
      .select("term_number, year")
      .eq("current", true)
      .maybeSingle();
    if (
      termData &&
      typeof termData === "object" &&
      "term_number" in termData &&
      "year" in termData &&
      termData.term_number &&
      termData.year
    ) {
      currentTerm = `Term ${termData.term_number} ${termData.year}`;
    } else {
      currentTerm = "Current term";
    }

    // 4. Upsert handler completions
    let completedCount = 0;
    for (const b of bookings) {
      // Only insert if not already completed (avoid double insert)
      const { data: already, error: alreadyErr } = await supabase
        .from("handler_class_status")
        .select("id")
        .eq("handler_id", b.client_id)
        .eq("class_id", classId)
        .eq("completed", true)
        .limit(1)
        .maybeSingle();
      if (!already && !alreadyErr) {
        await supabase.from("handler_class_status").insert({
          booking_id: b.id,
          class_id: classId,
          handler_id: b.client_id,
          class_type: classData?.class_type || "",
          completed: true,
          completed_at: new Date().toISOString(),
          completion_method: "auto",
          period: currentTerm,
        });
        completedCount++;
      }
    }
    return completedCount;
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

    // 2. Mark all enrolled handlers as completed for this class
    try {
      const completedCount = await markHandlersCompleted();
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
