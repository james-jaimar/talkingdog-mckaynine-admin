
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassesTable } from "@/components/classes/ClassesTable";
import { ClassesTabs } from "@/components/classes/ClassesTabs";
import { AddClassModal } from "@/components/classes/AddClassModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router-dom";
import { ClassHandlersTable } from "@/components/class-handlers/ClassHandlersTable";

export default function Classes() {
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const { classId } = useParams<{ classId: string }>();

  return (
    <DashboardLayout>
      <Helmet>
        <title>Classes - McKaynine Training Centre</title>
      </Helmet>
      <div className="w-full py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Class Management</h1>
          <Button onClick={() => setIsAddClassModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </div>

        {/* Secondary navigation bar */}
        <div className="mb-6">
          <ClassesTabs />
        </div>

        {/* Show handlers table if a class is selected, otherwise show classes table */}
        <div className="mt-4">
          {classId ? (
            <ClassHandlersTable classId={classId} />
          ) : (
            <ClassesTable filter={classId} />
          )}
        </div>

        <AddClassModal 
          open={isAddClassModalOpen} 
          onOpenChange={setIsAddClassModalOpen} 
        />
      </div>
    </DashboardLayout>
  );
}
