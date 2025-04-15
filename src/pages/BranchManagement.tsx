
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBranch } from "@/context/BranchContext";
import { BranchSelector } from "@/components/branches/BranchSelector";
import { BranchAllocationCheck } from "@/components/branch-maintenance/BranchAllocationCheck";
import { Helmet } from "react-helmet";

export default function BranchManagement() {
  const { currentBranch } = useBranch();

  return (
    <DashboardLayout>
      <Helmet>
        <title>Branch Management - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="flex flex-col space-y-6 w-full py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Branch Management</h1>
          <BranchSelector />
        </div>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Current Branch</CardTitle>
            <CardDescription>
              {currentBranch 
                ? `Managing data for branch: ${currentBranch.name}`
                : "No branch selected. Please select a branch to manage."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              All data you view and create will be associated with the currently selected branch. 
              Make sure you have the correct branch selected before managing handlers, classes, and schedules.
            </p>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BranchAllocationCheck />
          
          <Card>
            <CardHeader>
              <CardTitle>Branch Selection Tips</CardTitle>
              <CardDescription>
                Best practices for working with multiple branches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Always check the current branch before adding new data</li>
                <li>Use the Branch Allocation Check to fix unassigned records</li>
                <li>When viewing handlers or classes, the data is filtered by the selected branch</li>
                <li>Branch selection is remembered between sessions</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
