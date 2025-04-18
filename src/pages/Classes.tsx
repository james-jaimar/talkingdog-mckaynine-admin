
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassesTable } from "@/components/classes/ClassesTable";
import { ClassesTabs } from "@/components/classes/ClassesTabs";
import { AddClassModal } from "@/components/classes/AddClassModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Helmet } from "react-helmet";

export default function Classes() {
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);

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

        {/* Always show the class tabs on this page */}
        <div className="mb-6">
          <ClassesTabs alwaysShow={true} />
        </div>

        {/* Show classes table */}
        <div className="mt-4">
          <ClassesTable />
        </div>

        <AddClassModal 
          open={isAddClassModalOpen} 
          onOpenChange={setIsAddClassModalOpen} 
        />
      </div>
    </DashboardLayout>
  );
}
