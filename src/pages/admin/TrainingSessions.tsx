
import React, { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Settings } from "lucide-react";
import { format, isSaturday, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import {
  useTrainingSessions,
  useBranchTimeSlots,
  useCreateTrainingSessions,
  useDeleteTrainingSession,
  useCreateBranchTimeSlot,
  useDeleteBranchTimeSlot,
} from "@/hooks/useTrainingSessions";
import { useBranches } from "@/hooks/useBranches";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TrainingSessions = () => {
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showTimeSlotConfig, setShowTimeSlotConfig] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState({ time_slot: "", display_name: "" });

  const { data: branches } = useBranches();
  const { data: sessions, isLoading } = useTrainingSessions(selectedBranch || undefined);
  const { data: timeSlots } = useBranchTimeSlots(selectedBranch);
  const createSessions = useCreateTrainingSessions();
  const deleteSession = useDeleteTrainingSession();
  const createTimeSlot = useCreateBranchTimeSlot();
  const deleteTimeSlot = useDeleteBranchTimeSlot();

  // Set default branch
  React.useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  const existingSessionDates = useMemo(() => {
    if (!sessions) return new Set<string>();
    return new Set(sessions.map((s) => s.session_date));
  }, [sessions]);

  const handleCreateSessions = async () => {
    if (selectedDates.length === 0 || !selectedBranch) return;

    await createSessions.mutateAsync({
      branch_id: selectedBranch,
      session_dates: selectedDates.map((d) => format(d, "yyyy-MM-dd")),
    });

    setSelectedDates([]);
  };

  const handleAddAllSaturdays = () => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(addDays(today, 90)); // Next 3 months
    
    const saturdays = eachDayOfInterval({ start, end })
      .filter((date) => isSaturday(date))
      .filter((date) => !existingSessionDates.has(format(date, "yyyy-MM-dd")));

    setSelectedDates(saturdays);
  };

  const handleAddTimeSlot = async () => {
    if (!newTimeSlot.time_slot || !newTimeSlot.display_name || !selectedBranch) return;

    await createTimeSlot.mutateAsync({
      branch_id: selectedBranch,
      time_slot: newTimeSlot.time_slot,
      display_name: newTimeSlot.display_name,
      sort_order: (timeSlots?.length || 0) + 1,
    });

    setNewTimeSlot({ time_slot: "", display_name: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Training Sessions</h1>
          <div className="flex gap-4">
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
            <Dialog open={showTimeSlotConfig} onOpenChange={setShowTimeSlotConfig}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Time Slots
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configure Time Slots</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Time Slots</Label>
                    {timeSlots?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No time slots configured</p>
                    ) : (
                      <div className="space-y-2">
                        {timeSlots?.map((slot) => (
                          <div key={slot.id} className="flex items-center justify-between p-2 border rounded">
                            <span>{slot.display_name} ({slot.time_slot})</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTimeSlot.mutate(slot.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="border-t pt-4">
                    <Label>Add New Time Slot</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        placeholder="Time (e.g., 14:00)"
                        value={newTimeSlot.time_slot}
                        onChange={(e) =>
                          setNewTimeSlot({ ...newTimeSlot, time_slot: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Display (e.g., 2pm)"
                        value={newTimeSlot.display_name}
                        onChange={(e) =>
                          setNewTimeSlot({ ...newTimeSlot, display_name: e.target.value })
                        }
                      />
                    </div>
                    <Button
                      className="mt-2 w-full"
                      onClick={handleAddTimeSlot}
                      disabled={!newTimeSlot.time_slot || !newTimeSlot.display_name}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Time Slot
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add Training Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleAddAllSaturdays}>
                    Select All Saturdays (Next 3 Months)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDates([])}
                    disabled={selectedDates.length === 0}
                  >
                    Clear Selection
                  </Button>
                </div>
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={(dates) => setSelectedDates(dates || [])}
                  className="rounded-md border"
                  disabled={(date) => existingSessionDates.has(format(date, "yyyy-MM-dd"))}
                />
                {selectedDates.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {selectedDates.length} date(s) selected
                    </p>
                    <Button
                      onClick={handleCreateSessions}
                      disabled={createSessions.isPending}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create {selectedDates.length} Session(s)
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : sessions?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No training sessions created yet
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {sessions?.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <div className="font-medium">
                          {format(new Date(session.session_date), "EEEE, MMMM d, yyyy")}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {session.slots?.map((slot) => (
                            <Badge key={slot.id} variant="secondary">
                              {slot.display_name}
                            </Badge>
                          ))}
                          {(!session.slots || session.slots.length === 0) && (
                            <span className="text-sm text-muted-foreground">No time slots</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this training session?")) {
                            deleteSession.mutate(session.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TrainingSessions;
