import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/context/BranchContext";
import { format, parseISO } from "date-fns";

interface ClassScheduleOption {
  id: string;
  className: string;
  classType: string;
  startTime: string;
  selectedDates: string[];
  trainerName: string;
  capacity: number;
  currentEnrollment: number;
}

interface ClassInvitationSelectorProps {
  nextClassType?: string;
  onSelectSchedule: (schedule: ClassScheduleOption | null) => void;
  selectedScheduleId?: string;
}

export function ClassInvitationSelector({
  nextClassType,
  onSelectSchedule,
  selectedScheduleId,
}: ClassInvitationSelectorProps) {
  const { currentBranch } = useBranch();
  const [selectedId, setSelectedId] = useState<string>(selectedScheduleId || "");

  // Fetch available class schedules for the given class type
  const { data: schedules, isLoading } = useQuery({
    queryKey: ["available-class-schedules", nextClassType, currentBranch?.id],
    queryFn: async () => {
      if (!nextClassType || !currentBranch?.id) return [];

      // Get class schedules that match the class type and are in the future
      const { data, error } = await supabase
        .from("class_schedules")
        .select(`
          id,
          start_time,
          selected_dates,
          class:classes!inner (
            id,
            name,
            class_type,
            capacity,
            branch_id
          ),
          trainer:trainers (
            first_name,
            last_name
          ),
          bookings (
            id
          )
        `)
        .eq("class.branch_id", currentBranch.id)
        .eq("class.class_type", nextClassType)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching class schedules:", error);
        return [];
      }

      // Transform to our format
      return (data || []).map((schedule): ClassScheduleOption => ({
        id: schedule.id,
        className: (schedule.class as any)?.name || "Unknown Class",
        classType: (schedule.class as any)?.class_type || "",
        startTime: schedule.start_time,
        selectedDates: (schedule.selected_dates || []) as string[],
        trainerName: schedule.trainer 
          ? `${(schedule.trainer as any).first_name} ${(schedule.trainer as any).last_name}` 
          : "TBD",
        capacity: (schedule.class as any)?.capacity || 8,
        currentEnrollment: (schedule.bookings as any[])?.length || 0,
      }));
    },
    enabled: !!nextClassType && !!currentBranch?.id,
  });

  // Update parent when selection changes
  useEffect(() => {
    if (selectedId && schedules) {
      const schedule = schedules.find(s => s.id === selectedId);
      onSelectSchedule(schedule || null);
    } else {
      onSelectSchedule(null);
    }
  }, [selectedId, schedules, onSelectSchedule]);

  // Reset selection if schedules change
  useEffect(() => {
    if (selectedScheduleId) {
      setSelectedId(selectedScheduleId);
    }
  }, [selectedScheduleId]);

  const formatScheduleDates = (schedule: ClassScheduleOption) => {
    if (schedule.selectedDates.length > 0) {
      const dates = schedule.selectedDates.slice(0, 3);
      const formatted = dates.map(d => format(parseISO(d), "MMM d")).join(", ");
      if (schedule.selectedDates.length > 3) {
        return `${formatted} +${schedule.selectedDates.length - 3} more`;
      }
      return formatted;
    }
    return format(parseISO(schedule.startTime), "MMM d, yyyy");
  };

  if (!nextClassType) {
    return (
      <div className="text-sm text-muted-foreground">
        Select a template first to see available class schedules.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground animate-pulse">
        Loading available classes...
      </div>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200">
            No upcoming {nextClassType} classes
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            Create a class schedule first before sending invitations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Select Class to Invite To</Label>
      <Select value={selectedId} onValueChange={setSelectedId}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a class schedule..." />
        </SelectTrigger>
        <SelectContent>
          {schedules.map((schedule) => {
            const spotsLeft = schedule.capacity - schedule.currentEnrollment;
            const isFull = spotsLeft <= 0;
            
            return (
              <SelectItem 
                key={schedule.id} 
                value={schedule.id}
                disabled={isFull}
              >
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1">
                    <div className="font-medium">{schedule.className}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatScheduleDates(schedule)}
                      <Clock className="h-3 w-3 ml-2" />
                      {format(parseISO(schedule.startTime), "h:mm a")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isFull ? "destructive" : "secondary"} className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {spotsLeft} spots
                    </Badge>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {selectedId && schedules && (
        <div className="p-3 bg-primary/5 rounded-lg text-sm space-y-1 border border-primary/10">
          {(() => {
            const schedule = schedules.find(s => s.id === selectedId);
            if (!schedule) return null;
            return (
              <>
                <p><strong>Class:</strong> {schedule.className}</p>
                <p><strong>Trainer:</strong> {schedule.trainerName}</p>
                <p><strong>Dates:</strong> {formatScheduleDates(schedule)}</p>
                <p><strong>Available Spots:</strong> {schedule.capacity - schedule.currentEnrollment} of {schedule.capacity}</p>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
