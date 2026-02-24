import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MessageSquarePlus } from "lucide-react";

interface TrainerNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handlerId: string;
  handlerName: string;
  dogName?: string;
  trainerId: string;
  trainerName: string;
}

export function TrainerNoteModal({
  open,
  onOpenChange,
  handlerId,
  handlerName,
  dogName,
  trainerId,
  trainerName,
}: TrainerNoteModalProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();

  const handleSubmit = async () => {
    if (!notes.trim()) {
      toast.error("Please enter some notes");
      return;
    }

    setIsSubmitting(true);
    try {
      // First, append the notes to the handler's existing notes
      const { data: handler, error: fetchError } = await supabase
        .from("clients")
        .select("notes")
        .eq("id", handlerId)
        .single();

      if (fetchError) throw fetchError;

      const timestamp = new Date().toLocaleString();
      const noteEntry = `\n\n--- Trainer Note from ${trainerName} (${timestamp}) ---\n${notes.trim()}`;
      const updatedNotes = (handler.notes || "") + noteEntry;

      // Update handler notes
      const { error: updateError } = await supabase
        .from("clients")
        .update({ notes: updatedNotes })
        .eq("id", handlerId);

      if (updateError) throw updateError;

      // Create a task for admin (trainer_note type)
      const taskTitle = `Trainer note: ${handlerName}${dogName ? ` (${dogName})` : ""}`;
      const taskDescription = `${trainerName} left a note:\n\n${notes.trim()}`;

      const { error: taskError } = await supabase.from("handler_tasks").insert({
        handler_id: handlerId,
        task_type: "trainer_note",
        title: taskTitle,
        description: taskDescription,
        status: "pending",
        branch_id: currentBranch?.id || null,
      });

      if (taskError) throw taskError;

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["pending-task-count"] });
      queryClient.invalidateQueries({ queryKey: ["handlers"] });

      toast.success("Note saved and task created for admin");
      setNotes("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving trainer note:", error);
      toast.error(`Failed to save note: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNotes("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5" />
            Note for Admin
          </DialogTitle>
          <DialogDescription>
            Leave a note about <strong>{handlerName}</strong>
            {dogName && <> ({dogName})</>}. This will create a task for admin to review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Your Notes</Label>
            <Textarea
              id="notes"
              placeholder="Enter your observations, questions, or notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px]"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !notes.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Note"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
