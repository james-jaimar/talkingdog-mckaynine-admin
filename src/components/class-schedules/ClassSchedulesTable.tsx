
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
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
import { useClassTermSpanning } from "@/hooks/useClassTermSpanning";

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
  const { data: spanningData, isLoading: spanningLoading } = useClassTermSpanning(classId);

  const { data: schedules, isLoading, error, refetch } = useQuery({
    queryKey: ["class-schedules", classId, termData?.id, spanningData?.isSpanning],
    queryFn: async () => {
      console.log("Fetching class schedules for classId:", classId, "term:", termData?.id, "isSpanning:", spanningData?.isSpanning);
      
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
      
      // Only filter by term if the class doesn't span across terms
      if (termData?.id && (!spanningData?.isSpanning)) {
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
      
      // Also invalidate spanning data after deletion
      await Promise.all([
        refetch(),
        spanningData && useClassTermSpanning(classId).refetch
      ]);
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

  if (isLoading || spanningLoading) {
    return <SchedulesTableLoading />;
  }

  // Show a special message for spanning classes with no schedules in current term
  if ((!schedules || schedules.length === 0) && spanningData?.isSpanning) {
    return (
      <div className="text-center p-8 bg-amber-50 rounded-md border border-amber-200">
        <p className="text-amber-800 font-medium">This class spans multiple terms, but has no schedules in the current term.</p>
        <p className="text-amber-600 text-sm mt-2">
          Try selecting a different term or add new schedules to this term.
        </p>
        {spanningData.terms && spanningData.terms.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold">Available in these terms:</p>
            <ul className="text-sm mt-1 space-y-1">
              {spanningData.terms.map(term => (
                <li key={term.id} className="text-amber-700">
                  Term {term.term_number} ({term.academic_years.year})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
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
      {spanningData?.isSpanning && (
        <div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-800 text-sm">
            This class spans across multiple terms. All schedules are shown regardless of the selected term.
          </p>
        </div>
      )}

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
