
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// This is a new utility, meant to be placed in the action column for each class row
export function ClassActionButtons({ classId, classStatus }: { classId: string; classStatus: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const closeClassMutation = useMutation({
    mutationFn: async () => {
      // 1. Set class status to closed
      const { error: classError } = await supabase
        .from("classes")
        .update({ status: "closed", updated_at: new Date().toISOString() })
        .eq("id", classId);
      if (classError) throw classError;

      // 2. For each handler in handler_class_status for this class, mark complete if not already completed
      const { data: handlers, error: handlerError } = await supabase
        .from("handler_class_status")
        .select("*")
        .eq("class_type", classId);

      if (handlerError) throw handlerError;

      for (const h of handlers ?? []) {
        if (h.completion_status === "none" || h.completion_status === null || !h.completion_status) {
          await supabase
            .from("handler_class_status")
            .update({
              completion_status: "auto",
              completion_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", h.id);
        }
      }

      // You may want to trigger invalidate for queries here
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      await queryClient.invalidateQueries({ queryKey: ["class-handlers", classId] });
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Class closed!",
        description: "This class and its handlers have been marked as completed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Unable to close class",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  if (classStatus === "closed") {
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-green-200 text-green-800">Closed</span>
    );
  }

  return (
    <Button
      size="sm"
      className={cn("bg-mckaynine-600 hover:bg-mckaynine-700")}
      onClick={() => closeClassMutation.mutate()}
      disabled={closeClassMutation.isPending}
      type="button"
      title="Close this class for marking completion"
    >
      {closeClassMutation.isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-1" />
          Closing...
        </>
      ) : (
        "Close Class"
      )}
    </Button>
  );
}
