import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClassTypes } from "@/hooks/useClassTypes";
import { useAvailableTerms } from "@/hooks/useAvailableTerms";
import { Loader2 } from "lucide-react";
import { TaskWithHandler } from "@/hooks/useAllTasks";

interface EditTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithHandler | null;
  onSave: (taskId: string, updates: Record<string, any>) => Promise<void>;
}

const TASK_TYPES = [
  { value: "send_info_pack", label: "Send Info Pack" },
  { value: "enrollment", label: "Enrollment" },
  { value: "follow_up", label: "Follow Up" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function EditTaskModal({ open, onOpenChange, task, onSave }: EditTaskModalProps) {
  const { classTypeNames } = useClassTypes();
  const { terms: availableTerms } = useAvailableTerms();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [taskType, setTaskType] = useState("other");
  const [classType, setClassType] = useState("none");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("pending");
  const [targetTermId, setTargetTermId] = useState("none");

  // Populate form when task changes
  useEffect(() => {
    if (task) {
      setTaskType(task.task_type || "other");
      setClassType(task.class_type || "none");
      setTitle(task.title || "");
      setDescription(task.description || "");
      setDueDate(task.due_date ? task.due_date.split("T")[0] : "");
      setStatus(task.status || "pending");
      setTargetTermId(task.target_term_id || "none");
    }
  }, [task]);

  const handleSubmit = async () => {
    if (!task || !title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave(task.id, {
        task_type: taskType,
        class_type: classType === "none" ? null : classType,
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        status,
        target_term_id: targetTermId === "none" ? null : targetTermId,
        completed_at: status === "completed" ? new Date().toISOString() : (status === "pending" ? null : undefined),
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlerName = task?.handler
    ? `${task.handler.first_name} ${task.handler.last_name}`
    : "Unassigned";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Handler: <span className="font-medium">{handlerName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Type */}
          <div className="space-y-2">
            <Label>Task Type</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Type */}
          <div className="space-y-2">
            <Label>Class Type (Optional)</Label>
            <Select value={classType} onValueChange={setClassType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {classTypeNames.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Term */}
          <div className="space-y-2">
            <Label>Target Term (Optional)</Label>
            <Select value={targetTermId} onValueChange={setTargetTermId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="none">None</SelectItem>
                {availableTerms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Task Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Follow up on enrollment inquiry"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional notes or context..."
              rows={3}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date (Optional)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
