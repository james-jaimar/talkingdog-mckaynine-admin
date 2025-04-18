
import { useLocation } from "react-router-dom";

export function useClassIdFromUrl() {
  const location = useLocation();
  
  // Updated regex patterns to better catch all class-related URLs
  const classesMatch = location.pathname.match(/\/classes\/([^/]+)$/);
  const schedulesMatch = location.pathname.match(/\/classes\/([^/]+)\/schedules/);
  const handlersMatch = location.pathname.match(/\/class\/([^/]+)\/handlers/);
  
  if (classesMatch && classesMatch[1]) {
    return classesMatch[1];
  } else if (schedulesMatch && schedulesMatch[1]) {
    return schedulesMatch[1];
  } else if (handlersMatch && handlersMatch[1]) {
    return handlersMatch[1];
  }
  
  return null;
}
