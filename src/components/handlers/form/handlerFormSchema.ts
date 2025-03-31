
import { z } from "zod";

// Form validation schema
export const handlerFormSchema = z.object({
  first_name: z.string().min(1, { message: "First name is required" }),
  last_name: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  notes: z.string().optional(),
  branch_id: z.string().optional(),
});

export type FormValues = z.infer<typeof handlerFormSchema>;
