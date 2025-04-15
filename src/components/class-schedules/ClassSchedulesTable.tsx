
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { EditClassScheduleModal } from "./EditClassScheduleModal";
import { useAuth } from "@/context/AuthContext";
import { useBranch } from "@/context/BranchContext";
import { ClassSchedule } from "./types/classSchedule";
import { ScheduleTableAlert } from "./ScheduleTableAlert";
import { SchedulesTableContent } from "./SchedulesTableContent";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface ClassSchedulesTableProps {
  classId: string;
}

export function ClassSchedulesTable({ classId }: ClassSchedulesTableProps) {
  const [scheduleToEdit, setScheduleToEdit] = useState<ClassSchedule | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { currentBranch } = useBranch();

  const { data: schedules, isLoading, error, refetch } = useQuery({
    queryKey: ["class-schedules", classId, user?.id, currentBranch?.id],
    queryFn: async () => {
      console.log("Fetching class schedules for classId:", classId);
      console.log("Current user ID:", user?.id);
      console.log("Current branch ID:", currentBranch?.id);
      
      if (!user || !session) {
        console.log("User not authenticated, aborting fetch");
        return [];
      }
      
      const { data, error } = await supabase
        .from("class_schedules")
        .select(`
          *,
          trainer:trainer_id (first_name, last_name)
        `)
        .eq("class_id", classId)
        .order("start_time");
      
      if (error) {
        console.error("Error fetching class schedules:", error);
        throw error;
      }
      
      console.log("Class schedules data:", data);
      return data as ClassSchedule[];
    },
    enabled: !!classId && !!user && !!session && !!currentBranch,
  });

  const handleDeleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from("class_schedules")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      toast({
        title: "Schedule deleted",
        description: "The class schedule has been successfully deleted.",
      });
      
      refetch();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Error",
        description: "Failed to delete the schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditSchedule = (schedule: ClassSchedule) => {
    setScheduleToEdit(schedule);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    refetch();
    setScheduleToEdit(null);
    setIsEditModalOpen(false);
  };

  if (!user || !session) {
    return (
      <ScheduleTableAlert 
        message="You need to log in to view class schedules." 
        variant="warning"
      />
    );
  }

  if (!currentBranch) {
    return (
      <ScheduleTableAlert 
        message="Please select a branch to view class schedules." 
        variant="warning"
      />
    );
  }

  if (error) {
    return (
      <ScheduleTableAlert 
        message={`Error loading schedules: ${error instanceof Error ? error.message : "Unknown error"}`} 
        variant="error"
      />
    );
  }

  if (isLoading) {
    return <div className="py-10 text-center">Loading schedules...</div>;
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Trainer</TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead>Recurrence Pattern</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SchedulesTableContent 
              schedules={schedules || []} 
              onEdit={handleEditSchedule} 
              onDelete={handleDeleteSchedule} 
            />
          </TableBody>
        </Table>
      </div>

      {scheduleToEdit && (
        <EditClassScheduleModal 
          open={isEditModalOpen} 
          onOpenChange={setIsEditModalOpen} 
          classId={classId}
          schedule={scheduleToEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
