
import * as z from "zod";

export const classFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().default(""), // Always a string, defaults to empty string
  class_type: z.string().min(1, { message: "Please select a class type" }),
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
  io_inventory_code: z.string().optional().default(""),
});


export type ClassFormValues = z.infer<typeof classFormSchema>;
