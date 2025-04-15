
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrainersTable } from "@/components/trainers/TrainersTable";
import { AddTrainerModal } from "@/components/trainers/AddTrainerModal";
import { Helmet } from "react-helmet";

export default function Trainers() {
  return (
    <DashboardLayout>
      <Helmet>
        <title>Trainers - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="flex flex-col space-y-6 w-full py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Trainers</h1>
          <AddTrainerModal />
        </div>
        
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle>All Trainers</CardTitle>
            <CardDescription>
              Manage all dog trainers across all branches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrainersTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
