
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Class } from "@/components/classes/types/class";
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

  return (
    <>
      <Breadcrumb className="mb-4">
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

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/classes")}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Classes
            </Button>
            <h1 className="text-2xl font-bold">{classData?.name} Schedules</h1>
          </div>
          <p className="text-muted-foreground">Manage schedules for this class</p>
        </div>
        <Button onClick={onAddSchedule}>
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
      </div>
    </>
  );
}
