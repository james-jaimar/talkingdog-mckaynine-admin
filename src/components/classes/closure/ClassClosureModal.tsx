import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEnrolledHandlers } from "./useEnrolledHandlers";
import { HandlerCompletionRow } from "./HandlerCompletionRow";
import { ClassClosureModalProps, HandlerCompletionData } from "./types";
import { useClassTypes } from "@/hooks/useClassTypes";

// Format date as "Mon YY" (e.g., "May 25")
function formatCompletionPeriod(date: Date): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);
  return `${month} ${year}`;
}

export function ClassClosureModal({
  isOpen,
  onClose,
  classId,
  className,
  classType,
  onClassClosed,
}: ClassClosureModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { classTypes: allClassTypes } = useClassTypes(true);
  
  // Build dynamic next class map from DB
  const nextClassMap: Record<string, string> = {};
  allClassTypes.forEach(ct => {
    if (ct.next_class_type) {
      nextClassMap[ct.name] = ct.next_class_type;
    }
  });
  
  // Fetch class schedule to get the last date
  const { data: lastClassDate } = useQuery({
    queryKey: ["class-schedule-dates", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_schedules")
        .select("selected_dates")
        .eq("class_id", classId)
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      // Get the last date from selected_dates array
      const dates = data?.selected_dates || [];
      if (dates.length === 0) return null;
      
      // Sort dates and get the last one
      const sortedDates = [...dates].sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      );
      return new Date(sortedDates[0]);
    },
    enabled: isOpen && !!classId,
  });
  
  const { data: enrolledHandlers, isLoading: loadingHandlers } = useEnrolledHandlers(classId);
  
  const [completionData, setCompletionData] = useState<HandlerCompletionData[]>([]);
  const [isClosing, setIsClosing] = useState(false);

  // Initialize completion data when handlers load
  useEffect(() => {
    if (enrolledHandlers?.length) {
      setCompletionData(
        enrolledHandlers.map((h) => ({
          booking_id: h.booking_id,
          handler_id: h.handler_id,
          handler_name: h.handler_name,
          dog_name: h.dog_name,
          pass_percentage: null,
          result_status: "passed" as const,
          result_notes: "",
          next_action: "none" as const,
        }))
      );
    }
  }, [enrolledHandlers]);

  const handleUpdateHandler = (index: number, data: HandlerCompletionData) => {
    setCompletionData((prev) => {
      const updated = [...prev];
      updated[index] = data;
      return updated;
    });
  };

  const handleBulkAction = (action: "mark_all_passed" | "set_continuing" | "set_wants_info") => {
    setCompletionData((prev) =>
      prev.map((item) => {
        switch (action) {
          case "mark_all_passed":
            return { ...item, result_status: "passed" as const };
          case "set_continuing":
            return { ...item, next_action: "continuing" as const };
          case "set_wants_info":
            return { ...item, next_action: "wants_info" as const };
          default:
            return item;
        }
      })
    );
  };

  const handleCloseClass = async () => {
    setIsClosing(true);

    try {
      // 1. Update class status to closed
      const { error: classError } = await supabase
        .from("classes")
        .update({ status: "closed" })
        .eq("id", classId);

      if (classError) throw classError;

      // 2. Insert/update handler_class_status for each handler
      let completedCount = 0;
      let tasksCreated = 0;

      // Get class branch_id for task creation (once, outside loop)
      const { data: classData } = await supabase
        .from("classes")
        .select("branch_id")
        .eq("id", classId)
        .single();
      const classBranchId = classData?.branch_id || null;

      for (const handler of completionData) {
        // YOGA SPECIAL CASE: Delete previous yoga entries for this handler/dog
        // Yoga classes are monthly - we only want to show the latest entry
        if (classType === 'Yoga') {
          // Get the dog_id from the booking
          const { data: bookingData } = await supabase
            .from("bookings")
            .select("dog_id")
            .eq("id", handler.booking_id)
            .single();
          
          if (bookingData?.dog_id) {
            // Delete all previous yoga entries for this handler + dog combination
            await supabase
              .from("handler_class_status")
              .delete()
              .eq("handler_id", handler.handler_id)
              .eq("dog_id", bookingData.dog_id)
              .eq("class_type", "Yoga");
          }
        }

        // Upsert handler class status
        const { error: statusError } = await supabase
          .from("handler_class_status")
          .upsert({
            booking_id: handler.booking_id,
            class_id: classId,
            handler_id: handler.handler_id,
            class_type: classType,
            completed: true,
            completed_at: new Date().toISOString(),
            completion_method: "manual",
            period: lastClassDate ? formatCompletionPeriod(lastClassDate) : new Date().toLocaleDateString('en-US', { month: 'short' }) + ' ' + new Date().getFullYear().toString().slice(-2),
            pass_percentage: handler.pass_percentage,
            result_status: handler.result_status,
            result_notes: handler.result_notes,
            next_action: handler.next_action,
            next_class_type: handler.next_class_type || null,
            next_term_number: handler.next_term_number || null,
            next_term_year: handler.next_term_year || null,
            action_completed: false,
            is_currently_enrolled: false,
          }, {
            onConflict: 'id'
          });

        if (!statusError) completedCount++;

        // 3. Create tasks based on next_action

        // Get dog info from the booking for task context
        const { data: bookingForTask } = await supabase
          .from("bookings")
          .select("dog_id, dogs:dog_id(name)")
          .eq("id", handler.booking_id)
          .single();
        const taskDogId = bookingForTask?.dog_id || null;
        const taskDogName = (bookingForTask?.dogs as any)?.name || handler.dog_name || null;

        // Compute target_month from next term info
        let targetMonth: string | null = null;
        if (handler.next_term_number && handler.next_term_year) {
          // Map term numbers to approximate start months
          const termToMonth: Record<string, string> = { '1': '01', '2': '04', '3': '07', '4': '10' };
          const monthStr = termToMonth[String(handler.next_term_number)] || '01';
          targetMonth = `${handler.next_term_year}-${monthStr}`;
        }

        if (handler.next_action === "wants_info") {
          const nextClass = nextClassMap[classType] || "next class";
          await supabase.from("handler_tasks").insert({
            handler_id: handler.handler_id,
            class_type: classType,
            task_type: "send_info_pack",
            title: `Send ${nextClass} info pack${taskDogName ? ` (${taskDogName})` : ''}`,
            description: `Handler completed ${classType}. Send information about ${nextClass} class.`,
            status: "pending",
            branch_id: classBranchId,
            dog_id: taskDogId,
            dog_name: taskDogName,
            target_month: targetMonth,
          });
          tasksCreated++;
        } else if (handler.next_action === "continuing") {
          const nextClass = handler.next_class_type || nextClassMap[classType] || "next class";
          const termInfo = handler.next_term_number && handler.next_term_year 
            ? `Term ${handler.next_term_number} ${handler.next_term_year}`
            : "upcoming term";
          
          await supabase.from("handler_tasks").insert({
            handler_id: handler.handler_id,
            class_type: classType,
            task_type: "enrollment",
            title: `Enroll in ${nextClass} - ${termInfo}${taskDogName ? ` (${taskDogName})` : ''}`,
            description: `Handler completed ${classType}. Follow up on enrollment for ${nextClass} in ${termInfo}.`,
            status: "pending",
            branch_id: classBranchId,
            dog_id: taskDogId,
            dog_name: taskDogName,
            target_month: targetMonth,
          });
          tasksCreated++;
        }
      }

      // Invalidate task queries so they update without needing a refresh
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["handler-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["pending-task-count"] });
      queryClient.invalidateQueries({ queryKey: ["handler-class-status"] });

      toast({
        title: "Class closed successfully",
        description: `${completedCount} handler(s) marked as completed. ${tasksCreated} follow-up task(s) created.`,
      });

      onClassClosed();
      onClose();
    } catch (error: any) {
      console.error("Error closing class:", error);
      toast({
        title: "Failed to close class",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Close Class: {className}
          </DialogTitle>
          <DialogDescription>
            Record completion details for each handler. Tasks will be auto-created based on their next action.
          </DialogDescription>
        </DialogHeader>

        {loadingHandlers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !enrolledHandlers?.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-2" />
            <p>No enrolled handlers found for this class.</p>
          </div>
        ) : (
          <>
            {/* Bulk Actions */}
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("mark_all_passed")}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark All Passed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("set_continuing")}
              >
                ➡️ All Continuing
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("set_wants_info")}
              >
                📧 All Want Info
              </Button>
            </div>

            {/* Handler Table */}
            <div className="border rounded-lg overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Handler / Dog</TableHead>
                    <TableHead className="w-[140px]">Result</TableHead>
                    <TableHead className="w-[80px]">%</TableHead>
                    <TableHead className="w-[150px]">Next Action</TableHead>
                    {/* Dynamic columns shown when any handler has "continuing" */}
                    {completionData.some(h => h.next_action === "continuing") && (
                      <>
                        <TableHead className="w-[140px]">Next Term</TableHead>
                        <TableHead className="w-[140px]">Next Class</TableHead>
                      </>
                    )}
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completionData.map((handler, index) => (
                    <HandlerCompletionRow
                      key={handler.booking_id}
                      data={handler}
                      onChange={(data) => handleUpdateHandler(index, data)}
                      index={index}
                      showContinuingColumns={completionData.some(h => h.next_action === "continuing")}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="flex gap-4 flex-wrap">
                <span>
                  <strong>{completionData.filter(h => h.result_status === "passed").length}</strong> Passed
                </span>
                <span>
                  <strong>{completionData.filter(h => h.next_action === "continuing").length}</strong> Continuing
                </span>
                <span>
                  <strong>{completionData.filter(h => h.next_action === "wants_info").length}</strong> Want Info
                </span>
                <span>
                  <strong>{completionData.filter(h => h.next_action === "stopping").length}</strong> Stopping
                </span>
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isClosing}>
            Cancel
          </Button>
          <Button
            onClick={handleCloseClass}
            disabled={isClosing || !enrolledHandlers?.length}
          >
            {isClosing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Closing...
              </>
            ) : (
              "Close Class & Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
