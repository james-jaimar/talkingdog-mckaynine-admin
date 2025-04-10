
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Class } from "@/components/classes/types/class";
import { useIsMobile } from "@/hooks/useIsMobile";
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from "@/components/ui/breadcrumb";

interface ClassSchedulesHeaderProps {
  classData: Class | null;
  classId: string;
  onAddSchedule: () => void;
}

export function ClassSchedulesHeader({ 
  classData, 
  classId, 
  onAddSchedule 
}: ClassSchedulesHeaderProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <>
      {!isMobile && (
        <Breadcrumb className="mb-4 hidden sm:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/classes">Classes</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{classData?.name || 'Class'} Schedules</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/classes")}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {isMobile ? "Back" : "Back to Classes"}
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold truncate">
              {isMobile && classData?.name?.length > 15 
                ? `${classData?.name.substring(0, 15)}...` 
                : classData?.name} Schedules
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Manage schedules for this class</p>
        </div>
        <Button onClick={onAddSchedule} size={isMobile ? "sm" : "default"} className="mt-3 sm:mt-0 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          {isMobile ? "Add" : "Add Schedule"}
        </Button>
      </div>
    </>
  );
}
