
import { useState } from "react";
import { Helmet } from "react-helmet";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassSchedulesTable } from "@/components/class-schedules/ClassSchedulesTable";
import { AddClassScheduleModal } from "@/components/class-schedules/AddClassScheduleModal";
import { ClassSchedulesHeader } from "@/components/class-schedules/ClassSchedulesHeader";
import { Class } from "@/components/classes/types/class";

interface ClassSchedulesContentProps {
  classId: string;
  classData: Class;
}

export function ClassSchedulesContent({ classId, classData }: ClassSchedulesContentProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  console.log("Rendering ClassSchedulesContent with:", { classId, className: classData?.name });

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

        <ClassSchedulesTable classId={classId} />

        <AddClassScheduleModal 
          open={isAddModalOpen} 
          onOpenChange={setIsAddModalOpen} 
          classId={classId}
          classData={classData}
        />
      </div>
    </DashboardLayout>
  );
}
