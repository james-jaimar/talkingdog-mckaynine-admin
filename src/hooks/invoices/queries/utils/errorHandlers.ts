
import { toast } from "sonner";

/**
 * Handle errors in query functions
 */
export const handleQueryError = (error: any, message: string): never => {
  console.error(message, error);
  toast.error(message);
  throw error;
};
