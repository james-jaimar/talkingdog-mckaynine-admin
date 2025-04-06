
import { toast } from "sonner";

/**
 * Shared utility functions for invoice mutations
 */

export const handleMutationError = (error: any, message: string): void => {
  console.error(message, error);
  toast.error(message);
};

