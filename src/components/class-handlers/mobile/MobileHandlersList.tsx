import { Booking } from "../types/booking";
import { MobileHandlerCard } from "./MobileHandlerCard";

interface MobileHandlersListProps {
  handlers: Booking[];
  selectedDate: string | null;
  classId: string;
  classType?: string;
  startEditing: (booking: Booking) => void;
}

export function MobileHandlersList({ 
  handlers, 
  selectedDate, 
  classId,
  classType,
  startEditing 
}: MobileHandlersListProps) {
  if (!handlers || handlers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No handlers enrolled in this class
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {handlers.map(booking => (
        <MobileHandlerCard
          key={booking.id}
          booking={booking}
          selectedDate={selectedDate}
          classId={classId}
          classType={classType}
          onEdit={startEditing}
        />
      ))}
    </div>
  );
}
