
import { useState } from "react";

export function useRemoveHandler() {
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const [bookingToRemove, setBookingToRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = (bookingId: string) => {
    setBookingToRemove(bookingId);
    setOpenRemoveDialog(true);
  };

  return {
    openRemoveDialog,
    setOpenRemoveDialog,
    bookingToRemove,
    setBookingToRemove,
    isRemoving,
    setIsRemoving,
    handleRemove
  };
}
