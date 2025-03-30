
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassesTable } from "@/components/classes/ClassesTable";
import { AddClassModal } from "@/components/classes/AddClassModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Classes() {
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Class Management</h1>
          <Button onClick={() => setIsAddClassModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </div>

        <ClassesTable />

        <AddClassModal 
          open={isAddClassModalOpen} 
          onOpenChange={setIsAddClassModalOpen} 
        />
      </div>
    </DashboardLayout>
  );
}
