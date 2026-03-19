import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useClassTypes } from "@/hooks/useClassTypes";
import { useAvailableTerms } from "@/hooks/useAvailableTerms";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Handler {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TASK_TYPES = [
  { value: "send_info_pack", label: "Send Info Pack" },
  { value: "enrollment", label: "Enrollment" },
  { value: "follow_up", label: "Follow Up" },
  { value: "other", label: "Other" },
];

// CLASS_TYPES now loaded dynamically via useClassTypes hook

export function CreateTaskModal({ open, onOpenChange }: CreateTaskModalProps) {
  const queryClient = useQueryClient();
  const { currentBranch } = useBranch();
  const { classTypeNames } = useClassTypes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handlerSearch, setHandlerSearch] = useState("");
  const [handlers, setHandlers] = useState<Handler[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedHandler, setSelectedHandler] = useState<Handler | null>(null);

  // Form state
  const [taskType, setTaskType] = useState("other");
  const [classType, setClassType] = useState("none");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Search handlers when search term changes
  useEffect(() => {
    const searchHandlers = async () => {
      if (handlerSearch.length < 2) {
        setHandlers([]);
        return;
      }

      setIsSearching(true);
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, email")
        .or(
          `first_name.ilike.%${handlerSearch}%,last_name.ilike.%${handlerSearch}%,email.ilike.%${handlerSearch}%`
        )
        .limit(10);

      if (!error && data) {
        setHandlers(data);
      }
      setIsSearching(false);
    };

    const debounce = setTimeout(searchHandlers, 300);
    return () => clearTimeout(debounce);
  }, [handlerSearch]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("handler_tasks").insert({
        handler_id: selectedHandler?.id || null,
        task_type: taskType,
        class_type: classType === "none" ? null : classType,
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        status: "pending",
        branch_id: currentBranch?.id || null,
      });

      if (error) throw error;

      toast.success("Task created successfully");
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["pending-task-count"] });
      
      // Reset form and close modal
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
    setSelectedHandler(null);
    setHandlerSearch("");
    setHandlers([]);
  };

  const selectHandler = (handler: Handler) => {
    setSelectedHandler(handler);
    setHandlerSearch("");
    setHandlers([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a manual task for follow-ups, reminders, or any custom action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Handler Selection */}
          <div className="space-y-2">
            <Label>Handler (Optional)</Label>
            {selectedHandler ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">
                    {selectedHandler.first_name} {selectedHandler.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedHandler.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedHandler(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={handlerSearch}
                  onChange={(e) => setHandlerSearch(e.target.value)}
                  className="pl-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
                {handlers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                    {handlers.map((handler) => (
                      <button
                        key={handler.id}
                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                        onClick={() => selectHandler(handler)}
                      >
                        <p className="font-medium">
                          {handler.first_name} {handler.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {handler.email}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Task Type */}
          <div className="space-y-2">
            <Label htmlFor="taskType">Task Type</Label>
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
            <Label htmlFor="classType">Class Type (Optional)</Label>
            <Select value={classType} onValueChange={setClassType}>
              <SelectTrigger>
                <SelectValue placeholder="Select class type" />
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

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Follow up on enrollment inquiry"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional notes or context..."
              rows={3}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input
              id="dueDate"
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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
