
// Calculate available slots
export const calculateAvailableSlots = (classItem: any) => {
  if (!classItem) return 0;
  if (!classItem.capacity) return 0;
  
  // If no class_schedules, return full capacity
  if (!classItem.class_schedules || classItem.class_schedules.length === 0) {
    return classItem.capacity;
  }
  
  // Count total bookings across all schedules
  const totalBookings = classItem.class_schedules.reduce((total: number, schedule: any) => {
    if (!schedule.bookings) return total;
    return total + schedule.bookings.length;
  }, 0);
  
  // Available slots = capacity - total bookings
  const availableSlots = Math.max(0, classItem.capacity - totalBookings);
  console.log(`Class ${classItem.name}: capacity=${classItem.capacity}, bookings=${totalBookings}, available=${availableSlots}`);
  return availableSlots;
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
