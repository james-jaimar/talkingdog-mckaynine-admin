
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClassSchedule } from "./types/classSchedule";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { EditClassScheduleModal } from "./EditClassScheduleModal";
import { useAuth } from "@/context/AuthContext";

interface ClassSchedulesTableProps {
  classId: string;
}

export function ClassSchedulesTable({ classId }: ClassSchedulesTableProps) {
  const [scheduleToEdit, setScheduleToEdit] = useState<ClassSchedule | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: schedules, isLoading, refetch } = useQuery({
    queryKey: ["class-schedules", classId, user?.id],
    queryFn: async () => {
      console.log("Fetching class schedules for classId:", classId);
      
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
    enabled: !!classId && !!user,
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

  if (isLoading) {
    return <div className="py-10 text-center">Loading schedules...</div>;
  }

  return (
    <div>
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-2 text-left font-medium">Start Time</th>
              <th className="p-2 text-left font-medium">End Time</th>
              <th className="p-2 text-left font-medium">Trainer</th>
              <th className="p-2 text-left font-medium">Recurring</th>
              <th className="p-2 text-left font-medium">Recurrence Pattern</th>
              <th className="p-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules && schedules.length > 0 ? (
              schedules.map((schedule) => (
                <tr key={schedule.id} className="border-b">
                  <td className="p-2">{format(new Date(schedule.start_time), "PPp")}</td>
                  <td className="p-2">{format(new Date(schedule.end_time), "PPp")}</td>
                  <td className="p-2">
                    {schedule.trainer 
                      ? `${schedule.trainer.first_name} ${schedule.trainer.last_name}`
                      : "Not assigned"}
                  </td>
                  <td className="p-2">{schedule.recurring ? "Yes" : "No"}</td>
                  <td className="p-2">{schedule.recurrence_pattern || "N/A"}</td>
                  <td className="p-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditSchedule(schedule)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `/bookings/${schedule.id}`}>
                          <Users className="mr-2 h-4 w-4" />
                          Manage Handlers
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  No schedules found. Click "Add Schedule" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {scheduleToEdit && (
        <EditClassScheduleModal 
          open={isEditModalOpen} 
          onOpenChange={setIsEditModalOpen} 
          classId={classId}
          schedule={scheduleToEdit}
          onSuccess={() => {
            refetch();
            setScheduleToEdit(null);
          }}
        />
      )}
    </div>
  );
}
