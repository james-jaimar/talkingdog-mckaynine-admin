
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassesTable } from "@/components/classes/ClassesTable";
import { ClassesTabs } from "@/components/classes/ClassesTabs";
import { AddClassModal } from "@/components/classes/AddClassModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Helmet } from "react-helmet";
import { useBranch } from "@/context/BranchContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div>Something went wrong: {error.message}</div>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={resetErrorBoundary}
        >
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export default function Classes() {
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const { currentBranch } = useBranch();

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

        {!currentBranch ? (
          <Alert variant="warning" className="bg-amber-50 border-amber-200 mb-6">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Please select a branch to view and manage classes
            </AlertDescription>
          </Alert>
        ) : (
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => {
              // Reset the state of your app here
              window.location.reload();
            }}
          >
            {/* Always show the class tabs on this page */}
            <div className="mb-6">
              <ClassesTabs alwaysShow={true} />
            </div>

            {/* Show classes table */}
            <div className="mt-4">
              <ClassesTable />
            </div>
          </ErrorBoundary>
        )}

        <AddClassModal 
          open={isAddClassModalOpen} 
          onOpenChange={setIsAddClassModalOpen} 
        />
      </div>
    </DashboardLayout>
  );
}
