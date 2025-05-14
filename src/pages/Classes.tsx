
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassesTable } from "@/components/classes/ClassesTable";
import { ClassesTabs } from "@/components/classes/ClassesTabs";
import { AddClassModal } from "@/components/classes/AddClassModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Helmet } from "react-helmet";
import { useTerm } from "@/context/TermContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function Classes() {
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const { termData, selectedYear, selectedTermNumber } = useTerm();

  return (
    <DashboardLayout>
      <Helmet>
        <title>Classes - McKaynine Training Centre</title>
      </Helmet>
      <div className="w-full py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Class Management</h1>
            <p className="text-sm text-muted-foreground">
              {termData ? 
                `Currently viewing Term ${termData.term_number}, ${selectedYear}` : 
                "No term selected"}
            </p>
          </div>
          <Button onClick={() => setIsAddClassModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </div>

        {!termData && (
          <Alert variant="warning" className="mb-6">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              No term is currently selected. Please select a term to view classes for that period.
            </AlertDescription>
          </Alert>
        )}

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
