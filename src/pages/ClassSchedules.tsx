
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassSchedulesTable } from "@/components/class-schedules/ClassSchedulesTable";
import { AddClassScheduleModal } from "@/components/class-schedules/AddClassScheduleModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Class } from "@/components/classes/types/class";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/AuthContext";
import { useBranch } from "@/context/BranchContext";

export default function ClassSchedules() {
  const { classId } = useParams<{ classId: string }>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { currentBranch } = useBranch();
  const navigate = useNavigate();

  console.log("ClassSchedules component rendering with classId:", classId);
  console.log("Current user:", user);
  console.log("Current branch:", currentBranch);

  // Redirect to classes page if no classId
  useEffect(() => {
    if (!classId && user && currentBranch) {
      console.log("No classId provided, redirecting to classes page");
      navigate("/classes");
    }
  }, [classId, user, currentBranch, navigate]);

  const { data: classData, isLoading, error } = useQuery({
    queryKey: ["class", classId, user?.id, currentBranch?.id],
    queryFn: async () => {
      if (!classId) return null;
      
      console.log("Fetching class with ID:", classId);
      
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching class:", error);
        toast({
          title: "Error", 
          description: "Failed to load class details."
        });
        throw error;
      }
      
      console.log("Class data received:", data);
      return data as Class;
    },
    enabled: !!classId && !!user && !!session && !!currentBranch,
  });

  // If user is not authenticated, show auth message
  if (!user || !session) {
    return (
      <DashboardLayout>
        <div className="w-full py-6 flex justify-center">
          <p>You need to log in to view class schedules.</p>
        </div>
      </DashboardLayout>
    );
  }

  // If no branch is selected, show message
  if (!currentBranch) {
    return (
      <DashboardLayout>
        <div className="w-full py-6 flex justify-center">
          <p>Please select a branch to view class schedules.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="w-full py-6 flex justify-center">
          <p>Loading class information...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="w-full py-6 flex justify-center">
          <p>Error loading class data: {error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!classData && !isLoading && classId) {
    return (
      <DashboardLayout>
        <div className="w-full py-6 flex justify-center">
          <p>Class not found. The class may no longer exist or you might not have permission to view it.</p>
          <Button 
            variant="outline" 
            className="ml-4"
            onClick={() => navigate("/classes")}
          >
            Return to Classes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // If no classId was provided in the URL
  if (!classId) {
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

  return (
    <DashboardLayout>
      <Helmet>
        <title>{classData?.name} Schedules - McKaynine Training Centre</title>
      </Helmet>
      <div className="w-full py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{classData?.name} Schedules</h1>
            <p className="text-muted-foreground">Manage schedules for this class</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </div>

        <ClassSchedulesTable classId={classId} />

        <AddClassScheduleModal 
          open={isAddModalOpen} 
          onOpenChange={setIsAddModalOpen} 
          classId={classId}
          classData={classData!}
        />
      </div>
    </DashboardLayout>
  );
}
