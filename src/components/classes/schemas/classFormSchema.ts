
import * as z from "zod";

// Define the class types to match the database enum exactly - these should match the database enum values
export const CLASS_TYPES = ['Puppy', 'EO', 'CGC Bronze', 'CGC Silver', 'Beginner', 'Novice', 'WT', 'A-Test', 'Yoga'] as const;

export const classFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().default(""), // Always a string, defaults to empty string
  class_type: z.enum(CLASS_TYPES, { 
    required_error: "Please select a class type",
    invalid_type_error: "Please select a valid class type"
  }),
  duration: z.coerce.number().min(1, { message: "Duration must be at least 1 minute" }),
  capacity: z.coerce.number().min(1, { message: "Capacity must be at least 1" }),
  course_fee: z.coerce.number().min(0),
  enrollment_fee: z.coerce.number().min(0),
  mckaynine_commission_type: z.enum(['percentage', 'amount']),
  mckaynine_commission_value: z.coerce.number().min(0),
  admin_fee_type: z.enum(['percentage', 'amount']),
  admin_fee_value: z.coerce.number().min(0),
  trainer_fee_type: z.enum(['percentage', 'amount']),
  trainer_fee_value: z.coerce.number().min(0),
  branchId: z.string().min(1, { message: "Branch is required" }),
  report_month_override: z.string().nullable().optional(),
});


export type ClassFormValues = z.infer<typeof classFormSchema>;
