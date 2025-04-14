
import { useState } from "react";

export function useRemoveHandler() {
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const [bookingToRemove, setBookingToRemove] = useState<string | null>(null);

  const handleRemove = (bookingId: string) => {
    setBookingToRemove(bookingId);
    setOpenRemoveDialog(true);
  };

  return {
    openRemoveDialog,
    setOpenRemoveDialog,
    bookingToRemove,
    setBookingToRemove,
    handleRemove
  };
}
