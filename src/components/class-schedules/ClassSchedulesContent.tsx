
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassSchedulesTable } from "@/components/class-schedules/ClassSchedulesTable";
import { AddClassScheduleModal } from "@/components/class-schedules/AddClassScheduleModal";
import { ClassSchedulesHeader } from "@/components/class-schedules/ClassSchedulesHeader";
import { Class } from "@/components/classes/types/class";
import { useQueryClient } from "@tanstack/react-query";

interface ClassSchedulesContentProps {
  classId: string;
  classData: Class;
}

export function ClassSchedulesContent({ classId, classData }: ClassSchedulesContentProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Add state to track table refresh
  const [tableKey, setTableKey] = useState(0);

  console.log("Rendering ClassSchedulesContent with:", { classId, className: classData?.name });

  const handleScheduleAdded = () => {
    console.log("Schedule added, refreshing data");
    // Invalidate the class schedules query
    queryClient.invalidateQueries({ queryKey: ['class-schedules', classId] });
    // Close the modal
    setIsAddModalOpen(false);
    // Force a re-render of the table component
    setTableKey(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>{classData?.name} Schedules - McKaynine Training Centre</title>
      </Helmet>
      <div className="w-full py-6">
        <ClassSchedulesHeader 
          classData={classData} 
          classId={classId}
          onAddSchedule={() => setIsAddModalOpen(true)}
        />

        <ClassSchedulesTable key={tableKey} classId={classId} />

        <AddClassScheduleModal 
          open={isAddModalOpen} 
          onOpenChange={setIsAddModalOpen} 
          classId={classId}
          classData={classData}
          onSuccess={handleScheduleAdded}
        />
      </div>
    </DashboardLayout>
  );
}
