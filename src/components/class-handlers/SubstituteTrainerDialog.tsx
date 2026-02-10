import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserRoundCog, X, Loader2 } from "lucide-react";
import { useSubstituteTrainers } from "./hooks/useSubstituteTrainers";

interface SubstituteTrainerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  scheduleDates: string[];
}

export function SubstituteTrainerDialog({
  open,
  onOpenChange,
  classId,
  scheduleDates,
}: SubstituteTrainerDialogProps) {
  const {
    originalTrainerId,
    substitutes,
    trainers,
    isLoading,
    assignSubstitute,
    removeSubstitute,
    getTrainerName,
  } = useSubstituteTrainers(classId);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [notes, setNotes] = useState("");

  const sortedDates = [...scheduleDates].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const getSubForDate = (date: string) => {
    const dateOnly = date.split("T")[0];
    return substitutes.find((s) => s.class_date === dateOnly);
  };

  const handleAssign = async () => {
    if (!selectedDate || !selectedTrainer) return;
    const dateOnly = selectedDate.split("T")[0];
    await assignSubstitute.mutateAsync({
      classDate: dateOnly,
      substituteTrainerId: selectedTrainer,
      notes: notes || undefined,
    });
    setSelectedDate(null);
    setSelectedTrainer("");
    setNotes("");
  };

  const handleRemove = async (date: string) => {
    const dateOnly = date.split("T")[0];
    await removeSubstitute.mutateAsync(dateOnly);
  };

  // Filter out the original trainer from the dropdown
  const availableTrainers = trainers.filter(
    (t) => t.id !== originalTrainerId
  );

  const originalTrainerName = originalTrainerId
    ? getTrainerName(originalTrainerId)
    : "Unknown";

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRoundCog className="h-5 w-5" />
            Substitute Trainers
          </DialogTitle>
          <DialogDescription>
            Assign substitute trainers for specific class dates. Original
            trainer: <strong>{originalTrainerName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date list with current assignments */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Class Dates</Label>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {sortedDates.map((date) => {
                const sub = getSubForDate(date);
                const dateStr = new Date(date).toLocaleDateString("en-ZA", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const isPast = new Date(date) < new Date();

                return (
                  <div
                    key={date}
                    className={`flex items-center justify-between p-2 rounded-md border text-sm ${
                      sub
                        ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                        : "bg-background border-border"
                    } ${isPast ? "opacity-75" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{dateStr}</span>
                      {sub && (
                        <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          Sub: {getTrainerName(sub.substitute_trainer_id)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {sub ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(date)}
                          disabled={removeSubstitute.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedTrainer("");
                            setNotes("");
                          }}
                        >
                          Assign Sub
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assignment form (shown when a date is selected) */}
          {selectedDate && (
            <div className="space-y-3 p-3 rounded-md border bg-muted/50">
              <Label className="text-sm font-medium">
                Assign substitute for{" "}
                {new Date(selectedDate).toLocaleDateString("en-ZA", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Label>

              <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trainer..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTrainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.first_name} {trainer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAssign}
                  disabled={!selectedTrainer || assignSubstitute.isPending}
                >
                  {assignSubstitute.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  )}
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedDate(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
