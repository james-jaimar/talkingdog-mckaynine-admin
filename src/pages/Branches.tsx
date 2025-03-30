
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BranchesTable } from "@/components/branches/BranchesTable";
import { AddBranchModal } from "@/components/branches/AddBranchModal";
import { Helmet } from "react-helmet";

export default function Branches() {
  return (
    <DashboardLayout>
      <Helmet>
        <title>Branches - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="flex flex-col space-y-6 w-full py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
          <AddBranchModal />
        </div>
        
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle>All Branches</CardTitle>
            <CardDescription>
              Manage all training centre branches and their assigned trainers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BranchesTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
