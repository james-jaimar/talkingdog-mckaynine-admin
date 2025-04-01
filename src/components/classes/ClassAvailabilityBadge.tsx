
import { Badge } from "@/components/ui/badge";
import { getAvailableSlotsBadgeVariant, getCustomBadgeClass } from "./utils/classSlotUtils";

interface ClassAvailabilityBadgeProps {
  availableSlots: number;
  capacity: number;
}

export function ClassAvailabilityBadge({ availableSlots, capacity }: ClassAvailabilityBadgeProps) {
  const slotVariant = getAvailableSlotsBadgeVariant(availableSlots, capacity);
  const customBadgeClass = getCustomBadgeClass(slotVariant);
  
  if (availableSlots === 0) {
    return (
      <Badge variant="destructive">
        No slots left
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
