
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface FinancialDashboardErrorProps {
  onRefresh: () => void;
  errorMessage?: string;
}

export function FinancialDashboardError({ 
  onRefresh,
  errorMessage = "Error loading financial data. Please try again or contact support."
}: FinancialDashboardErrorProps) {
  return (
    <RequireAdmin>
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button 
              onClick={onRefresh} 
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              {errorMessage.includes("branch") ? "Refresh Financial Data" : "Retry Loading Data"}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
