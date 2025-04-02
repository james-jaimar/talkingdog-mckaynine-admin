
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Class } from "@/components/classes/types/class";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useBranch } from "@/context/BranchContext";
import { ClassSchedulesLoading } from "@/components/class-schedules/ClassSchedulesLoading";
import { ClassSchedulesContent } from "@/components/class-schedules/ClassSchedulesContent";
import { NoClassSelected } from "@/components/class-schedules/NoClassSelected";
import { ClassNotFound } from "@/components/class-schedules/ClassNotFound";
import { AuthRequirements } from "@/components/class-schedules/AuthRequirements";

export default function ClassSchedules() {
  // Update to use both id and classId to support both URL patterns
  const { id, classId: urlClassId } = useParams<{ id: string; classId: string }>();
  const classId = id || urlClassId; // Use id from /classes/:id/schedules or classId from /class/:classId/schedules
  
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
    return <AuthRequirements message="You need to log in to view class schedules." />;
  }

  // If no branch is selected, show message
  if (!currentBranch) {
    return <AuthRequirements message="Please select a branch to view class schedules." />;
  }

  if (isLoading) {
    return <ClassSchedulesLoading message="Loading class information..." />;
  }

  if (error) {
    return <ClassSchedulesLoading message={`Error loading class data: ${error instanceof Error ? error.message : "Unknown error"}`} />;
  }

  if (!classData && !isLoading && classId) {
    return <ClassNotFound />;
  }

  // If no classId was provided in the URL
  if (!classId) {
    return <NoClassSelected />;
  }

  return <ClassSchedulesContent classId={classId} classData={classData!} />;
}
