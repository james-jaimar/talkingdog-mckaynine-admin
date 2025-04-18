
import { useParams, useSearchParams } from "react-router-dom";
import { ClassSchedulesLoading } from "@/components/class-schedules/ClassSchedulesLoading";
import { ClassSchedulesContent } from "@/components/class-schedules/ClassSchedulesContent";
import { NoClassSelected } from "@/components/class-schedules/NoClassSelected";
import { ClassNotFound } from "@/components/class-schedules/ClassNotFound";
import { AuthRequirements } from "@/components/class-schedules/AuthRequirements";
import { useClassData } from "@/components/class-schedules/hooks/useClassData";
import { ClassesTabs } from "@/components/classes/ClassesTabs";

export default function ClassSchedules() {
  // Support all possible sources of class ID (URL params, path params, and query params)
  const { id, classId: urlClassId } = useParams<{ id: string; classId: string }>();
  const [searchParams] = useSearchParams();
  const queryParamId = searchParams.get('classId');
  
  // Use the first available class ID from different sources
  const classId = id || urlClassId || queryParamId || '';
  
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

  return (
    <>
      {/* Add ClassesTabs with alwaysShow prop */}
      <ClassesTabs alwaysShow={true} />

      {isLoading ? (
        <ClassSchedulesLoading message="Loading class information..." />
      ) : error ? (
        <ClassSchedulesLoading message={`Error loading class data: ${error instanceof Error ? error.message : "Unknown error"}`} />
      ) : !classData && !isLoading && classId ? (
        <ClassNotFound />
      ) : !classId ? (
        <NoClassSelected />
      ) : (
        <ClassSchedulesContent classId={classId} classData={classData!} />
      )}
    </>
  );
}

