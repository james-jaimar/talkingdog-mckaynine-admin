
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";

interface ClassActionButtonsProps {
  classId: string;
  onEdit: () => void;
}

export function ClassActionButtons({ classId, onEdit }: ClassActionButtonsProps) {
  return (
    <div className="flex space-x-2">
      <Link to={`/classes/${classId}/schedules`}>
        <Button variant="outline" size="sm">
          Schedules
        </Button>
      </Link>
      <Link to={`/classes/${classId}/handlers`}>
        <Button variant="outline" size="sm">
          <Users className="h-3.5 w-3.5 mr-1" />
          Handlers
        </Button>
      </Link>
      <Button 
        variant="outline" 
        size="sm"
        onClick={onEdit}
      >
        Edit
      </Button>
    </div>
  );
}
