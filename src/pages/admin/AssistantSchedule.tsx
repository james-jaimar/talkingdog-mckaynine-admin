
import React, { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, X, Minus } from "lucide-react";
import { format } from "date-fns";
import { useAssistants } from "@/hooks/useAssistants";
import { useTrainingSessions } from "@/hooks/useTrainingSessions";
import { useAssistantAvailability, useUpdateAvailability } from "@/hooks/useAssistantAvailability";
import { useBranches } from "@/hooks/useBranches";
import { useAuth } from "@/context/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AvailabilityStatus = "available" | "unavailable" | "not_marked";

const AssistantSchedule = () => {
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  const { data: branches } = useBranches();
  const { data: assistants, isLoading: assistantsLoading } = useAssistants(selectedBranch || undefined);
  const { data: sessions, isLoading: sessionsLoading } = useTrainingSessions(selectedBranch || undefined);
  const { data: availability } = useAssistantAvailability(selectedBranch || undefined);
  const updateAvailability = useUpdateAvailability();

  // Set default branch
  React.useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  // Build availability lookup map
  const availabilityMap = useMemo(() => {
    const map = new Map<string, { status: AvailabilityStatus; notes: string | null }>();
    availability?.forEach((a) => {
      const key = `${a.assistant_id}-${a.training_session_slot_id}`;
      map.set(key, { status: a.status as AvailabilityStatus, notes: a.notes });
    });
    return map;
  }, [availability]);

  const handleCellClick = async (
    assistantId: string,
    slotId: string,
    currentStatus: AvailabilityStatus
  ) => {
    // Cycle through statuses: not_marked -> available -> unavailable -> not_marked
    const nextStatus: AvailabilityStatus =
      currentStatus === "not_marked"
        ? "available"
        : currentStatus === "available"
        ? "unavailable"
        : "not_marked";

    await updateAvailability.mutateAsync({
      assistant_id: assistantId,
      training_session_slot_id: slotId,
      status: nextStatus,
      marked_by: user?.id,
    });
  };

  const getStatusIcon = (status: AvailabilityStatus) => {
    switch (status) {
      case "available":
        return <Check className="h-4 w-4 text-green-600" />;
      case "unavailable":
        return <X className="h-4 w-4 text-amber-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusClass = (status: AvailabilityStatus) => {
    switch (status) {
      case "available":
        return "bg-green-100 hover:bg-green-200";
      case "unavailable":
        return "bg-amber-100 hover:bg-amber-200";
      default:
        return "bg-muted hover:bg-muted/80";
    }
  };

  const isLoading = assistantsLoading || sessionsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Assistant Schedule</h1>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches?.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Availability Grid</CardTitle>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-100 rounded" /> Available
              </span>
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 bg-amber-100 rounded" /> Unavailable
              </span>
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 bg-muted rounded" /> Not Marked
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : sessions?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No training sessions found. Create sessions first.
              </p>
            ) : assistants?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No assistants found. Add assistants first.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted text-left sticky left-0 z-10">
                        Assistant
                      </th>
                      {sessions?.map((session) => (
                        <th
                          key={session.id}
                          colSpan={session.slots?.length || 1}
                          className="border p-2 bg-muted text-center"
                        >
                          <div className="font-medium">
                            {format(new Date(session.session_date), "d MMM")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(session.session_date), "EEE")}
                          </div>
                        </th>
                      ))}
                    </tr>
                    <tr>
                      <th className="border p-2 bg-muted/50 sticky left-0 z-10"></th>
                      {sessions?.flatMap((session) =>
                        session.slots?.map((slot) => (
                          <th
                            key={slot.id}
                            className="border p-2 bg-muted/50 text-center text-sm"
                          >
                            {slot.display_name}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {assistants?.map((assistant) => (
                      <tr key={assistant.id}>
                        <td className="border p-2 font-medium sticky left-0 bg-background z-10">
                          {assistant.first_name} {assistant.last_name}
                        </td>
                        {sessions?.flatMap((session) =>
                          session.slots?.map((slot) => {
                            const key = `${assistant.id}-${slot.id}`;
                            const cellData = availabilityMap.get(key);
                            const status = cellData?.status || "not_marked";
                            const notes = cellData?.notes;

                            return (
                              <TooltipProvider key={slot.id}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <td
                                      className={cn(
                                        "border p-2 text-center cursor-pointer transition-colors",
                                        getStatusClass(status)
                                      )}
                                      onClick={() =>
                                        handleCellClick(assistant.id, slot.id, status)
                                      }
                                    >
                                      {getStatusIcon(status)}
                                    </td>
                                  </TooltipTrigger>
                                  {notes && (
                                    <TooltipContent>
                                      <p>{notes}</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {/* Summary row */}
                  <tfoot>
                    <tr className="bg-muted/30">
                      <td className="border p-2 font-medium sticky left-0 bg-muted/30 z-10">
                        Total Available
                      </td>
                      {sessions?.flatMap((session) =>
                        session.slots?.map((slot) => {
                          const count = assistants?.filter((a) => {
                            const key = `${a.id}-${slot.id}`;
                            return availabilityMap.get(key)?.status === "available";
                          }).length || 0;

                          return (
                            <td key={slot.id} className="border p-2 text-center font-medium">
                              {count}
                            </td>
                          );
                        })
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AssistantSchedule;
