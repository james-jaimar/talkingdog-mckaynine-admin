
import { z } from "zod";

export const classFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  level: z.string().min(1, "Level is required"),
  course_fee: z.coerce.number().min(0, "Course fee must be a positive number"),
  enrollment_fee: z.coerce.number().min(0, "Enrollment fee must be a positive number"),
  mckaynine_commission_type: z.enum(['percentage', 'amount']),
  mckaynine_commission_value: z.coerce.number().min(0),
  admin_fee_type: z.enum(['percentage', 'amount']),
  admin_fee_value: z.coerce.number().min(0),
  trainer_fee_type: z.enum(['percentage', 'amount']),
  trainer_fee_value: z.coerce.number().min(0),
  duration: z.coerce.number().int().min(1, "Duration must be at least 1 minute"),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1 person"),
  branchId: z.string().min(1, "Branch is required"),
});

export type ClassFormValues = z.infer<typeof classFormSchema>;
