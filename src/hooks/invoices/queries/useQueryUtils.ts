
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Shared utility functions for invoice queries
 */

export const handleQueryError = (error: any, message: string): never => {
  console.error(message, error);
  toast.error(message);
  throw error;
};

