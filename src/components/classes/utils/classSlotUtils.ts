
// Calculate available slots
export const calculateAvailableSlots = (classItem: any) => {
  if (!classItem.class_schedules) return classItem.capacity;
  
  // Count total bookings across all schedules
  const totalBookings = classItem.class_schedules.reduce((total: number, schedule: any) => {
    return total + (schedule.bookings ? schedule.bookings.length : 0);
  }, 0);
  
  // Available slots = capacity - total bookings
  return Math.max(0, classItem.capacity - totalBookings);
};

// Get badge color based on available slots
export const getAvailableSlotsBadgeVariant = (availableSlots: number, capacity: number) => {
  if (availableSlots === 0) return "destructive";
  if (availableSlots <= Math.ceil(capacity * 0.2)) return "warning"; // 20% or less slots remaining
  if (availableSlots <= Math.ceil(capacity * 0.5)) return "info"; // 50% or less slots remaining
  return "success";
};

// Get background color class for custom badge variants
export const getCustomBadgeClass = (variant: string) => {
  switch (variant) {
    case "warning": return "bg-amber-500 text-white hover:bg-amber-600";
    case "info": return "bg-blue-500 text-white hover:bg-blue-600";
    case "success": return "bg-green-500 text-white hover:bg-green-600";
    default: return "";
  }
};
