
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Class } from "@/components/classes/types/class";
import { SpanningTermsIndicator } from "./SpanningTermsIndicator";

interface ClassSchedulesHeaderProps {
  classData: Class;
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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div className="flex-1">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">{classData.name} Schedules</h1>
          <SpanningTermsIndicator classId={classId} />
        </div>
        <p className="text-muted-foreground mt-1">
          Manage class dates, times, and trainers
        </p>
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/classes`)}
        >
          Back to Classes
        </Button>
        <Button
          size="sm"
          onClick={onAddSchedule}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Schedule
        </Button>
      </div>
    </div>
  );
}
