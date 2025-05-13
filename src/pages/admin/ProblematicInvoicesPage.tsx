
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ProblematicInvoicesManager } from "@/components/admin/ProblematicInvoicesManager";
import RequireAdmin from "@/components/auth/RequireAdmin";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProblematicInvoicesPage() {
  return (
    <RequireAdmin>
      <DashboardLayout>
        <Helmet>
          <title>Problematic Invoices - McKaynine Training Centre</title>
        </Helmet>
        
        <div className="container mx-auto py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold">Problematic Invoices</h1>
            <Button variant="outline" size="sm" asChild>
              <Link to="/financial-reports" className="flex items-center">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Financial Reports
              </Link>
            </Button>
          </div>
          
          <div className="space-y-6">
            <ProblematicInvoicesManager />
          </div>
        </div>
      </DashboardLayout>
    </RequireAdmin>
  );
}
