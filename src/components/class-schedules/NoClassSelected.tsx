
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export function NoClassSelected() {
  const navigate = useNavigate();
  
  return (
    <DashboardLayout>
      <Helmet>
        <title>Class Schedules - McKaynine Training Centre</title>
      </Helmet>
      <div className="w-full py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Class Schedules</h1>
            <p className="text-muted-foreground">Select a class to view its schedules</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-md shadow-sm">
          <p>Please select a class from the Classes page to view its schedules.</p>
          <Button 
            onClick={() => navigate("/classes")}
            className="mt-4"
          >
            Go to Classes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
