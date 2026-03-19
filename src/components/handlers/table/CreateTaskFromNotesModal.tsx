import { useState } from "react";
import { useBranch } from "@/context/BranchContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClassTypes } from "@/hooks/useClassTypes";
import { useMonthOptions } from "@/hooks/useMonthOptions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface CreateTaskFromNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handler: {
    id: string;
    first_name: string;
    last_name?: string;
    dogs?: any[];
  };
}

const TASK_TYPES = [
  { value: "send_info_pack", label: "Send Info Pack" },
  { value: "enrollment", label: "Enrollment" },
  { value: "follow_up", label: "Follow Up" },
  { value: "other", label: "Other" },
];

export function CreateTaskFromNotesModal({ 
  open, 
  onOpenChange, 
  handler 
}: CreateTaskFromNotesModalProps) {
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  const { classTypeNames } = useClassTypes();
  const { months } = useMonthOptions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [taskType, setTaskType] = useState("other");
  const [classType, setClassType] = useState("none");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [targetMonth, setTargetMonth] = useState("none");

  const fullName = `${handler.first_name} ${handler.last_name || ''}`.trim();

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("handler_tasks").insert({
        handler_id: handler.id,
        task_type: taskType,
        class_type: classType === "none" ? null : classType,
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        status: "pending",
        branch_id: currentBranch?.id || null,
        target_month: targetMonth === "none" ? null : targetMonth,
      });
      if (error) throw error;
      toast.success("Task created successfully");
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["pending-task-count"] });
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to create task: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTaskType("other");
    setClassType("none");
    setTitle("");
    setDescription("");
    setDueDate("");
    setTargetMonth("none");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Create Task for {fullName}</DialogTitle>
          <DialogDescription>Create a task linked to this handler.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Task Type</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Class Type (Optional)</Label>
            <Select value={classType} onValueChange={setClassType}>
              <SelectTrigger><SelectValue placeholder="Select class type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {classTypeNames.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Month (Optional)</Label>
            <Select value={targetMonth} onValueChange={setTargetMonth}>
              <SelectTrigger><SelectValue placeholder="Select target month" /></SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="none">None</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Task Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Follow up on enrollment inquiry" />
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add any additional notes or context..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Due Date (Optional)</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
