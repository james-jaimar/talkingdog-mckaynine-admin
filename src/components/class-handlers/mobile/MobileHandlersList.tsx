
import { Button } from "@/components/ui/button";
import { Booking } from "../types/booking";

interface MobileHandlersListProps {
  handlers: Booking[];
  startEditing: (booking: Booking) => void;
}

export function MobileHandlersList({ handlers, startEditing }: MobileHandlersListProps) {
  return (
    <div className="sm:hidden">
      <div className="text-sm font-medium text-center mb-3 text-gray-500">
        Use the Batch Attendance button above for easier mobile attendance tracking
      </div>
      {handlers.map(booking => {
        const handler = booking.clients;
        const dog = booking.dogs;
        
        return (
          <div key={booking.id} className="border rounded-md p-3 mb-2">
            <div className="font-medium">{handler?.first_name} {handler?.last_name}</div>
            <div className="text-sm text-gray-500">{dog?.name} ({dog?.breed})</div>
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs">
                {booking.computed_payment_status === 'paid' ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">Paid</span>
                ) : (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">Unpaid</span>
                )}
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => startEditing(booking)}
              >
                Edit
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
