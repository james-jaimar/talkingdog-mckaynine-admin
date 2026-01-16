import { Link } from "react-router-dom";
import { ClassWithSchedules } from "../hooks/types/class-with-schedules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, ChevronRight, Edit2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { ClosedBadge } from "../ClosedBadge";

interface MobileClassCardProps {
  classItem: ClassWithSchedules;
  onEdit: () => void;
}

export function MobileClassCard({ classItem, onEdit }: MobileClassCardProps) {
  const scheduleCount = classItem.class_schedules?.length || 0;
  const isClosed = classItem.status === "closed";
  
  // Get class type badge color based on class type
  const getClassTypeBadge = () => {
    const classType = classItem.class_type?.toLowerCase() || '';
    if (classType.includes('puppy')) {
      return 'bg-pink-100 text-pink-800 border-pink-200';
    } else if (classType.includes('beginner') || classType.includes('novice')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (classType.includes('cgc')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (classType.includes('eo') || classType.includes('yoga')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div 
      className={`bg-card rounded-lg border shadow-sm p-4 mb-3 ${isClosed ? 'opacity-60 bg-muted' : ''}`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base truncate">{classItem.name}</h3>
            {isClosed && <ClosedBadge />}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`text-xs ${getClassTypeBadge()}`}>
              {classItem.class_type}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {classItem.duration} min
            </span>
            <span className="text-sm font-medium">
              {formatCurrency(classItem.course_fee)}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Info Row */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>Capacity: {classItem.capacity}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{scheduleCount} schedule{scheduleCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Branch */}
      <div className="text-xs text-muted-foreground mb-3">
        {classItem.branches?.name || "Unknown Branch"}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Link to={`/class/${classItem.id}/handlers`} className="flex-1">
          <Button 
            variant="default" 
            size="sm" 
            className="w-full h-11 text-sm font-medium"
            disabled={isClosed}
          >
            <Users className="h-4 w-4 mr-2" />
            Handlers
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        </Link>
        <Link to={`/class/${classItem.id}/schedules`} className="flex-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-11 text-sm font-medium"
            disabled={isClosed}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedules
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
