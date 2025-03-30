
import { z } from "zod";

export const classFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  level: z.string().min(1, "Level is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  duration: z.coerce.number().int().min(1, "Duration must be at least 1 minute"),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1 person"),
  branchId: z.string().min(1, "Branch is required"),
});

export type ClassFormValues = z.infer<typeof classFormSchema>;
