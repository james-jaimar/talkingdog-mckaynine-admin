
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
  // Secondary contact fields
  secondary_first_name: z.string().optional(),
  secondary_last_name: z.string().optional(),
  secondary_email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  secondary_phone: z.string().optional(),
  uses_whatsapp_status: z.enum(['yes', 'no', 'not_marked']),
  social_media_consent_status: z.enum(['yes', 'no', 'not_marked']),
});

export type FormValues = z.infer<typeof handlerFormSchema>;
