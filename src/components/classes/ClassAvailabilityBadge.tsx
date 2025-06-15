import { Badge } from "@/components/ui/badge";
import { getAvailableSlotsBadgeVariant, getCustomBadgeClass } from "./utils/classSlotUtils";
import { ClassWithSchedules } from "./hooks/types/class-with-schedules";
import { ClosedBadge } from "./ClosedBadge";

interface ClassAvailabilityBadgeProps {
  classItem: ClassWithSchedules;
}

export function ClassAvailabilityBadge({ classItem }: ClassAvailabilityBadgeProps) {
  // NEW: Priority—if status is closed, don't show slots, show closed
  if (classItem.status === "closed") {
    return <ClosedBadge />;
  }

  const totalEnrolled = classItem.class_schedules?.reduce((total, schedule) => {
    return total + (schedule.bookings?.length || 0);
  }, 0) || 0;

  const availableSlots = classItem.capacity - totalEnrolled;
  const slotVariant = getAvailableSlotsBadgeVariant(availableSlots, classItem.capacity);
  const customBadgeClass = getCustomBadgeClass(slotVariant);
  
  if (availableSlots <= 0) {
    return (
      <Badge variant="destructive">
        Fully booked
      </Badge>
    );
  }
  
  return (
    <Badge 
      variant={slotVariant === "success" || slotVariant === "info" || slotVariant === "warning" ? "outline" : "destructive"}
      className={customBadgeClass}
    >
      {availableSlots} slot{availableSlots !== 1 ? 's' : ''} left
    </Badge>
  );
}
