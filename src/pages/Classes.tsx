
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassesTable } from "@/components/classes/ClassesTable";
import { ClassesTabs } from "@/components/classes/ClassesTabs";
import { AddClassModal } from "@/components/classes/AddClassModal";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { Helmet } from "react-helmet";
import { useTerm } from "@/context/TermContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BulkClassImporter } from "@/components/handlers/import/BulkClassImporter";

export default function Classes() {
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
            <Button onClick={() => setIsAddClassModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </div>
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

        <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bulk Import Handlers to Classes</DialogTitle>
            </DialogHeader>
            <BulkClassImporter onImportSuccess={() => setIsBulkImportOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
