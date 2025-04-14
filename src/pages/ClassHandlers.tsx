
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassHandlersTable } from "@/components/class-handlers/ClassHandlersTable";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { AddHandlerToClassModal } from "@/components/classes/handlers/AddHandlerToClassModal";
import { Helmet } from "react-helmet";
import { FormNavigation } from "@/components/forms/FormNavigation";
import { useClassData } from "@/components/class-schedules/hooks/useClassData";
import { Link } from "react-router-dom";

export default function ClassHandlers() {
  const { id } = useParams<{ id: string }>();
  const classId = id; // Use the id from the URL parameter
  const [isAddHandlerModalOpen, setIsAddHandlerModalOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Use the enhanced useClassData hook that handles both class and schedule data
  const { 
    classData, 
    scheduleData,
    isLoading,
    error
  } = useClassData({ classId });
  
  // Track whether the component has mounted
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    return () => setHasMounted(false);
  }, []);

  const handleAddHandlerSuccess = () => {
    // Explicitly refresh the handlers data for this class
    if (classId) {
      console.log("Refreshing class handlers data after adding handler");
      queryClient.invalidateQueries({ queryKey: ['class-handlers', classId] });
    }
    setIsAddHandlerModalOpen(false);
  };

  // Error handling
  if (!classId) {
    return (
      <DashboardLayout>
        <div className="py-10 text-center">
          <h2 className="text-xl font-bold mb-4">Missing Class ID</h2>
          <p className="mb-6">A class ID is required to view its handlers.</p>
          <Link to="/classes">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Classes
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="py-10 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading Class</h2>
          <p className="mb-6">{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
          <Link to="/classes">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Classes
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading || !hasMounted) {
    return (
      <DashboardLayout>
        <div className="py-10 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading class details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout>
        <div className="py-10 text-center">
          <h2 className="text-xl font-bold mb-4">Class Not Found</h2>
          <p className="mb-6">The requested class could not be found.</p>
          <Link to="/classes">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Classes
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const timeDisplay = scheduleData ? 
    `${new Date(scheduleData.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
     ${new Date(scheduleData.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 
    '';

  // Create a subtitle with branch, level, and time information
  const subtitle = `${classData.branches?.name || ''} | Level: ${classData.level}${timeDisplay ? ` | ${timeDisplay}` : ''}`;

  return (
    <DashboardLayout>
      <Helmet>
        <title>{classData.name} Handlers - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="w-full py-6">
        <FormNavigation
          title={`${classData.name} - Handlers`}
          subtitle={subtitle}
          backPath="/classes"
          backLabel="Back to Classes"
        />
        
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setIsAddHandlerModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Handler
          </Button>
        </div>
        
        <ClassHandlersTable classId={classId} />
        
        <AddHandlerToClassModal
          open={isAddHandlerModalOpen}
          onOpenChange={setIsAddHandlerModalOpen}
          classId={classId}
          classData={classData}
          onSuccess={handleAddHandlerSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
