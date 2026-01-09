import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Plus, ListTodo } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { CreateTaskFromNotesModal } from "./CreateTaskFromNotesModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useHandlerTasks, HandlerTask } from "@/hooks/useHandlerTasks";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface HandlerNotesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handler: {
    id: string;
    first_name: string;
    last_name?: string;
    notes?: string;
    dogs?: any[];
  };
}

export function HandlerNotesSheet({ 
  open, 
  onOpenChange, 
  handler 
}: HandlerNotesSheetProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(handler.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const { tasks, isLoading: isLoadingTasks } = useHandlerTasks(handler.id);

  const fullName = `${handler.first_name} ${handler.last_name || ''}`.trim();

  // Update local notes when handler changes
  useEffect(() => {
    setNotes(handler.notes || "");
  }, [handler.notes, handler.id]);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({ notes })
        .eq("id", handler.id);

      if (error) throw error;
      
      toast.success("Notes saved successfully");
      queryClient.invalidateQueries({ queryKey: ["handlers"] });
    } catch (error: any) {
      toast.error(`Failed to save notes: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const pendingTasks = tasks.filter(t => t.status === "pending");
  const completedTasks = tasks.filter(t => t.status === "completed");

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "completed": return "default";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[400px] sm:w-[450px] flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-lg">{fullName}</SheetTitle>
            <SheetDescription>
              Notes and tasks for this handler
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 flex flex-col mt-4 space-y-4 overflow-hidden">
            {/* Notes Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Notes</h3>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this handler..."
                className="min-h-[150px] resize-none"
              />
            </div>

            <Separator />

            {/* Create Task Button */}
            <Button 
              onClick={() => setShowTaskModal(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Task for {handler.first_name}
            </Button>

            <Separator />

            {/* Tasks Section */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Tasks</h3>
                {pendingTasks.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {pendingTasks.length} pending
                  </Badge>
                )}
              </div>
              
              <ScrollArea className="flex-1">
                {isLoadingTasks ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-4 text-center">
                    No tasks for this handler
                  </p>
                ) : (
                  <div className="space-y-2 pr-4">
                    {/* Pending Tasks */}
                    {pendingTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                    
                    {/* Completed Tasks (show last 5) */}
                    {completedTasks.length > 0 && (
                      <>
                        <div className="text-xs text-muted-foreground pt-2">
                          Recently Completed
                        </div>
                        {completedTasks.slice(0, 5).map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Task Modal */}
      <CreateTaskFromNotesModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        handler={handler}
      />
    </>
  );
}

function TaskCard({ task }: { task: HandlerTask }) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "completed": return "default";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="p-3 border rounded-md bg-muted/30 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-sm leading-tight">{task.title}</span>
        <Badge 
          variant={getStatusBadgeVariant(task.status || "pending")}
          className="text-xs shrink-0"
        >
          {task.status}
        </Badge>
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {task.class_type && (
          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">
            {task.class_type}
          </span>
        )}
        {task.due_date && (
          <span>Due: {format(new Date(task.due_date), "MMM d")}</span>
        )}
      </div>
    </div>
  );
}
