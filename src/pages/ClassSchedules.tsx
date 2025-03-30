
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassSchedulesTable } from "@/components/class-schedules/ClassSchedulesTable";
import { AddClassScheduleModal } from "@/components/class-schedules/AddClassScheduleModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Class } from "@/components/classes/types/class";
import { useToast } from "@/components/ui/use-toast";

export default function ClassSchedules() {
  const { classId } = useParams<{ classId: string }>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: classData, isLoading } = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      if (!classId) return null;
      
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .single();
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load class details.",
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Class;
    },
    enabled: !!classId,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 flex justify-center">
          <p>Loading class information...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!classData && !isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 flex justify-center">
          <p>Class not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{classData?.name} Schedules</h1>
            <p className="text-muted-foreground">Manage schedules for this class</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </div>

        <ClassSchedulesTable classId={classId || ''} />

        <AddClassScheduleModal 
          open={isAddModalOpen} 
          onOpenChange={setIsAddModalOpen} 
          classId={classId || ''}
          classData={classData!}
        />
      </div>
    </DashboardLayout>
  );
}
