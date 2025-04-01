
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrainersTable } from "@/components/trainers/TrainersTable";
import { AddTrainerModal } from "@/components/trainers/AddTrainerModal";
import { Helmet } from "react-helmet";
import { Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Trainers() {
  return (
    <DashboardLayout>
      <Helmet>
        <title>Trainers - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="flex flex-col space-y-6 w-full py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Trainers</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/trainer-references">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Manage Trainer References
              </Link>
            </Button>
            <AddTrainerModal />
          </div>
        </div>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Trainer User Accounts</AlertTitle>
          <AlertDescription>
            Trainers can now have user accounts to log in to the system. Use the "Create account" button to set up login credentials for trainers.
          </AlertDescription>
        </Alert>
        
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Before deleting trainers, you need to reassign their classes to other trainers. 
            Visit the <Link to="/trainer-references" className="font-medium underline">Trainer References</Link> page first.
          </AlertDescription>
        </Alert>
        
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
