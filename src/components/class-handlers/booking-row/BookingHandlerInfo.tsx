import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BookingHandlerInfoProps {
  booking: any;
  handlerClassStatus: any;
}

export function BookingHandlerInfo({ booking, handlerClassStatus }: BookingHandlerInfoProps) {
  const handlerCompleted = handlerClassStatus?.completion_status === "auto" || handlerClassStatus?.completion_status === "manual";

  return (
    <div>
      <div className="flex items-center space-x-2">
        <Avatar className="w-6 h-6">
          <AvatarImage src={booking.clients?.avatar_url} />
          <AvatarFallback>{booking.clients?.first_name?.charAt(0)}{booking.clients?.last_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none">{booking.clients?.first_name} {booking.clients?.last_name}</p>
          <p className="text-sm text-muted-foreground">
            {booking.dogs?.name} ({booking.dogs?.breed})
          </p>
        </div>
      </div>
      {handlerCompleted && (
        <span className="inline-block px-2 py-0.5 ml-2 text-xs rounded bg-blue-100 text-blue-800">
          Completed{handlerClassStatus.completion_status === "manual" ? " (manual)" : ""}
        </span>
      )}
    </div>
  );
}
