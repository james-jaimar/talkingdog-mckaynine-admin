
import React from "react";
import { Booking } from "../types/booking";

interface BookingHandlerInfoProps {
  booking: Booking;
}

export function BookingHandlerInfo({ booking }: BookingHandlerInfoProps) {
  return (
    <>
      <div>
        <span className="font-semibold">
          {booking.clients?.first_name} {booking.clients?.last_name}
        </span>
      </div>
      <div className="text-sm text-muted-foreground">
        {booking.dogs?.name} ({booking.dogs?.breed})
      </div>
    </>
  );
}
