
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { EditClassScheduleModal } from "./EditClassScheduleModal";
import { useAuth } from "@/context/AuthContext";
import { useBranch } from "@/context/BranchContext";
import { ClassSchedule } from "./types/classSchedule";
import { ScheduleTableAlert } from "./ScheduleTableAlert";
import { SchedulesTableContent } from "./SchedulesTableContent";
import { useTerm } from "@/context/TermContext";
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
  const queryClient = useQueryClient();
  const previousInvalidationRef = useRef<number>(0);
  const { termData } = useTerm();

  // Add a state to track if a refresh is needed
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { data: schedules, isLoading, error, refetch } = useQuery({
    queryKey: ["class-schedules", classId, refreshTrigger, termData?.id],
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
      
      // Filter by term if a term is selected
      if (termData?.id) {
        console.log(`Adding term filter: ${termData.id}`);
        query = query.eq("term_id", termData.id);
      }
      
      const { data, error } = await query.order("start_time");
      
      if (error) {
        console.error("Error fetching class schedules:", error);
        throw error;
      }
      
      // Transform the data to match the ClassSchedule type with class property
      const transformedData = data.map(item => ({
        ...item,
        class: item.classes  // Map 'classes' to 'class'
      }));
      
      console.log(`Retrieved ${transformedData.length} class schedules`);
      return transformedData as ClassSchedule[];
    },
    enabled: !!classId && !!user && !!session && !!currentBranch,
    staleTime: 10000, // Add staleTime to prevent excessive refetches
  });

  // Function to manually trigger a refresh
  const forceRefresh = () => {
    console.log("Forcing schedules refresh");
    setRefreshTrigger(prev => prev + 1);
  };

  // Subscribe to realtime changes on class_schedules table
  useEffect(() => {
    if (!classId || !user || !session) return;

    console.log("Setting up class schedules subscription");
    const channel = supabase
      .channel('table-db-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'class_schedules',
          filter: `class_id=eq.${classId}`
        }, 
        (payload) => {
          console.log("Received class_schedules change:", payload);
          forceRefresh();
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up class schedules subscription");
      supabase.removeChannel(channel);
    };
  }, [classId, user, session]);

  // Effect to refetch when term changes
  useEffect(() => {
    if (termData?.id) {
      console.log("Term changed, refetching schedules");
      refetch();
    }
  }, [termData?.id, refetch]);

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
      
      forceRefresh();
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
    // Set the schedule to edit first
    setScheduleToEdit(schedule);
    // Then open the modal
    setTimeout(() => {
      setIsEditModalOpen(true);
    }, 10);
  };

  const handleEditSuccess = () => {
    // Clear the edit state
    setScheduleToEdit(null);
    // Refresh data after a short delay
    setTimeout(() => {
      forceRefresh();
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
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            // If modal is closing, clear the schedule to edit after a short delay
            if (!open) {
              setTimeout(() => {
                setScheduleToEdit(null);
              }, 100);
            }
          }} 
          classId={classId}
          schedule={scheduleToEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
