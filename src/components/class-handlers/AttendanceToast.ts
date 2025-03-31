
// A simplified toast utility specifically for the attendance indicator
import { toast as originalToast } from "@/hooks/use-toast";

// Wrapper function to handle the type mismatch in the original toast function
export function attendanceToast(title: string, description: string, variant?: "default" | "destructive") {
  // Always call with the object format which is supported in the implementation
  return originalToast({
    title,
    description,
    variant
  });
}
