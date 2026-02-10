
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Check, X, Minus, LogOut } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { useAssistants } from "@/hooks/useAssistants";
import { useTrainingSessions } from "@/hooks/useTrainingSessions";
import { useAssistantAvailability, useUpdateAvailability } from "@/hooks/useAssistantAvailability";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AvailabilityStatus = "available" | "unavailable" | "not_marked";

const AssistantSchedulePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentAssistant, setCurrentAssistant] = useState<any>(null);
  const [noteInput, setNoteInput] = useState<{ slotId: string; value: string } | null>(null);

  // Get the assistant record for current user
  useEffect(() => {
    const fetchAssistant = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("assistants")
        .select("*, branch:branches(id, name)")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setCurrentAssistant(data);
      }
    };

    fetchAssistant();
  }, [user]);

  const branchId = currentAssistant?.branch_id;

  const { data: assistants, isLoading: assistantsLoading } = useAssistants(branchId);
  const { data: sessions, isLoading: sessionsLoading } = useTrainingSessions(branchId);
  const { data: availability } = useAssistantAvailability(branchId);
  const updateAvailability = useUpdateAvailability();

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
    // Only allow editing own availability
    if (assistantId !== currentAssistant?.id) return;

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

  const handleAddNote = async (slotId: string, note: string) => {
    if (!currentAssistant) return;

    const key = `${currentAssistant.id}-${slotId}`;
    const currentData = availabilityMap.get(key);

    await updateAvailability.mutateAsync({
      assistant_id: currentAssistant.id,
      training_session_slot_id: slotId,
      status: currentData?.status || "not_marked",
      notes: note || undefined,
      marked_by: user?.id,
    });

    setNoteInput(null);
    toast.success("Note saved");
  };

  const handleLogout = async () => {
    // Sign out directly to avoid AuthProvider redirecting to /auth
    await supabase.auth.signOut();
    window.location.href = "/assistant-login";
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

  const getStatusClass = (status: AvailabilityStatus, isOwn: boolean) => {
    const base = isOwn ? "cursor-pointer" : "cursor-default";
    switch (status) {
      case "available":
        return cn(base, "bg-green-100", isOwn && "hover:bg-green-200");
      case "unavailable":
        return cn(base, "bg-amber-100", isOwn && "hover:bg-amber-200");
      default:
        return cn(base, "bg-muted", isOwn && "hover:bg-muted/80");
    }
  };

  const isLoading = assistantsLoading || sessionsLoading || !currentAssistant;

  if (!user) {
    navigate("/assistant-login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header for assistants */}
      <header className="bg-mckaynine-700 text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="/lovable-uploads/2f69e0f2-9148-4d86-8e59-e9a89e76d520.png"
              alt="McKaynine"
              className="h-8"
            />
            <span className="font-semibold">Training Schedule</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">
              {currentAssistant?.first_name} {currentAssistant?.last_name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:text-white hover:bg-mckaynine-600">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Training Schedule</h1>
          {currentAssistant?.branch && (
            <p className="text-muted-foreground">{currentAssistant.branch.name}</p>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-100 rounded" /> Available
          </span>
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 bg-amber-100 rounded" /> Unavailable
          </span>
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 bg-muted rounded" /> Not Marked
          </span>
          <span className="text-xs">Click your row to toggle • Double-click to add note</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Schedule Grid</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : sessions?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No training sessions scheduled yet.
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
                    {assistants?.map((assistant) => {
                      const isOwnRow = assistant.id === currentAssistant?.id;
                      return (
                        <tr key={assistant.id} className={isOwnRow ? "bg-blue-50" : ""}>
                          <td className={cn(
                            "border p-2 font-medium sticky left-0 z-10",
                            isOwnRow ? "bg-blue-50" : "bg-background"
                          )}>
                            {assistant.first_name} {assistant.last_name}
                            {isOwnRow && <span className="text-xs text-blue-600 ml-2">(You)</span>}
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
                                          "border p-2 text-center transition-colors",
                                          getStatusClass(status, isOwnRow)
                                        )}
                                        onClick={() => {
                                          if (isOwnRow) {
                                            handleCellClick(assistant.id, slot.id, status);
                                          }
                                        }}
                                        onDoubleClick={() => {
                                          if (isOwnRow) {
                                            setNoteInput({ slotId: slot.id, value: notes || "" });
                                          }
                                        }}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note input dialog */}
        {noteInput && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="e.g., Away on holiday"
                  value={noteInput.value}
                  onChange={(e) => setNoteInput({ ...noteInput, value: e.target.value })}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setNoteInput(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleAddNote(noteInput.slotId, noteInput.value)}>
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default AssistantSchedulePage;
