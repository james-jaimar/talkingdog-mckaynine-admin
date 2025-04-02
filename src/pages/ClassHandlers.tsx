
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassHandlersTable } from "@/components/class-handlers/ClassHandlersTable";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { AddHandlerToClassModal } from "@/components/classes/handlers/AddHandlerToClassModal";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { FormNavigation } from "@/components/forms/FormNavigation";
import { useClassData } from "@/components/class-schedules/hooks/useClassData";

export default function ClassHandlers() {
  const { id } = useParams<{ id: string }>();
  const classId = id; // Use the id from the URL parameter
  const [isAddHandlerModalOpen, setIsAddHandlerModalOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Use the enhanced useClassData hook that handles both class and schedule data
  const { 
    classData, 
    scheduleData,
    isLoading 
  } = useClassData({ classId });

  const handleAddHandlerSuccess = () => {
    // Explicitly refresh the handlers data for this class
    if (classId) {
      console.log("Refreshing class handlers data after adding handler");
      queryClient.invalidateQueries({ queryKey: ['class-handlers', classId] });
    }
    setIsAddHandlerModalOpen(false);
  };

  // Auto-refresh the data periodically when on the handlers page
  useEffect(() => {
    if (!classId) return;
    
    // Auto-refresh every 3 seconds while on this page
    const refreshInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['class-handlers', classId] });
    }, 3000);
    
    return () => clearInterval(refreshInterval);
  }, [classId, queryClient]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-10 text-center">Loading class details...</div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout>
        <div className="py-10 text-center">Class not found</div>
      </DashboardLayout>
    );
  }

  // Create a display time string from schedule data if available
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
        
        {classId && <ClassHandlersTable classId={classId} />}
        
        {classId && (
          <AddHandlerToClassModal
            open={isAddHandlerModalOpen}
            onOpenChange={setIsAddHandlerModalOpen}
            classId={classId}
            classData={classData}
            onSuccess={handleAddHandlerSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
