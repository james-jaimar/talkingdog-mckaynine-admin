
import { useParams } from "react-router-dom";
import { ClassSchedulesLoading } from "@/components/class-schedules/ClassSchedulesLoading";
import { ClassSchedulesContent } from "@/components/class-schedules/ClassSchedulesContent";
import { NoClassSelected } from "@/components/class-schedules/NoClassSelected";
import { ClassNotFound } from "@/components/class-schedules/ClassNotFound";
import { AuthRequirements } from "@/components/class-schedules/AuthRequirements";
import { useClassData } from "@/components/class-schedules/hooks/useClassData";

export default function ClassSchedules() {
  // Update to use both id and classId to support both URL patterns
  const { id, classId: urlClassId } = useParams<{ id: string; classId: string }>();
  const classId = id || urlClassId; // Use id from /classes/:id/schedules or classId from /class/:classId/schedules
  
  console.log("ClassSchedules component rendering with classId:", classId);

  const { 
    classData, 
    isLoading, 
    error, 
    isAuthenticated, 
    hasBranch 
  } = useClassData({ classId });

  // If user is not authenticated, show auth message
  if (!isAuthenticated) {
    return <AuthRequirements message="You need to log in to view class schedules." />;
  }

  // If no branch is selected, show message
  if (!hasBranch) {
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
