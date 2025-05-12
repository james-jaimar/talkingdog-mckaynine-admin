
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { Loader2 } from "lucide-react";

export function FinancialDashboardLoading() {
  return (
    <RequireAdmin>
      <DashboardLayout>
        <div className="container mx-auto py-6 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg">Loading financial data...</p>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
