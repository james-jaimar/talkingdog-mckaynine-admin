
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useBranch } from "@/context/BranchContext";
import { ClassSchedule } from "./types/classSchedule";
import { ScheduleTableAlert } from "./ScheduleTableAlert";
import { SchedulesTableContent } from "./SchedulesTableContent";
import { useTerm } from "@/context/TermContext";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SchedulesTableLoading } from "./table/SchedulesTableLoading";
import { SchedulesTableError } from "./table/SchedulesTableError";
import { SchedulesEditModal } from "./table/SchedulesEditModal";

interface ClassSchedulesTableProps {
  classId: string;
}

export function ClassSchedulesTable({ classId }: ClassSchedulesTableProps) {
  const [scheduleToEdit, setScheduleToEdit] = useState<ClassSchedule | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { currentBranch } = useBranch();
  const { termData } = useTerm();

  const { data: schedules, isLoading, error, refetch } = useQuery({
    queryKey: ["class-schedules", classId, termData?.id],
    queryFn: async () => {
      console.log("Fetching class schedules for classId:", classId, "term:", termData?.id);
      
      if (!user || !session) {
        console.log("User not authenticated, aborting fetch");
        return [];
      }
      
      let query = supabase
        .from("class_schedules")
        .select(`
          *,
          trainer:trainer_id (first_name, last_name),
          classes:class_id (name)
        `)
        .eq("class_id", classId);
      
      if (termData?.id) {
        console.log(`Adding term filter: ${termData.id}`);
        query = query.eq("term_id", termData.id);
      }
      
      const { data, error } = await query.order("start_time");
      
      if (error) {
        console.error("Error fetching class schedules:", error);
        throw error;
      }
      
      const transformedData = data.map(item => ({
        ...item,
        class: item.classes
      }));
      
      console.log(`Retrieved ${transformedData.length} class schedules`);
      return transformedData as ClassSchedule[];
    },
    enabled: !!classId && !!user && !!session && !!currentBranch,
    staleTime: 10000,
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
    setTimeout(() => {
      setIsEditModalOpen(true);
    }, 10);
  };

  const handleEditSuccess = () => {
    setScheduleToEdit(null);
    setTimeout(() => {
      refetch();
    }, 300);
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
    return <SchedulesTableError error={error} />;
  }

  if (isLoading) {
    return <SchedulesTableLoading />;
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-md border">
        <p className="text-muted-foreground">No schedules found for this class.</p>
        <p className="text-sm mt-2">Add schedules to this class to start tracking attendance.</p>
      </div>
    );
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
              schedules={schedules} 
              onEdit={handleEditSchedule} 
              onDelete={handleDeleteSchedule} 
            />
          </TableBody>
        </Table>
      </div>

      <SchedulesEditModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        classId={classId}
        schedule={scheduleToEdit}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
