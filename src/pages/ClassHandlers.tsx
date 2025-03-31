
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassHandlersTable } from "@/components/class-handlers/ClassHandlersTable";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddHandlerToClassModal } from "@/components/classes/handlers/AddHandlerToClassModal";
import { Helmet } from "react-helmet";

export default function ClassHandlers() {
  // Check for both URL parameter patterns
  const params = useParams<{ id?: string; classId?: string }>();
  const classId = params.classId || params.id;
  const [isAddHandlerModalOpen, setIsAddHandlerModalOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: classInfo, isLoading } = useQuery({
    queryKey: ['class-details', classId],
    queryFn: async () => {
      if (!classId) return null;
      
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          branches:branch_id (
            name
          )
        `)
        .eq('id', classId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!classId
  });

  const handleAddHandlerSuccess = () => {
    // Refresh the handlers data after adding a new handler
    queryClient.invalidateQueries({ queryKey: ['class-handlers', classId] });
    // Close the modal
    setIsAddHandlerModalOpen(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-10 text-center">Loading class details...</div>
      </DashboardLayout>
    );
  }

  if (!classInfo) {
    return (
      <DashboardLayout>
        <div className="py-10 text-center">Class not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>{classInfo.name} Handlers - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="w-full py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{classInfo.name} - Handlers</h1>
            <p className="text-muted-foreground">
              Branch: {classInfo.branches?.name} | Level: {classInfo.level}
            </p>
          </div>
          
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
            classData={classInfo}
            onSuccess={handleAddHandlerSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
