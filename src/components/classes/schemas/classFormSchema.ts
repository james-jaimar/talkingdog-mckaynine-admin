
import * as z from "zod";
import { CLASS_TYPES } from "../types/class-types";

export const classFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  class_type: z.enum(['Puppy', 'EO', 'CGC Bronze', 'CGC Silver', 'Beginner', 'Novice', 'WT', 'A-Test', 'Yoga']),
  duration: z.number().min(1, { message: "Duration must be at least 1 minute" }),
  capacity: z.number().min(1, { message: "Capacity must be at least 1" }),
  course_fee: z.number().min(0),
  enrollment_fee: z.number().min(0),
  mckaynine_commission_type: z.enum(['percentage', 'amount']),
  mckaynine_commission_value: z.number().min(0),
  admin_fee_type: z.enum(['percentage', 'amount']),
  admin_fee_value: z.number().min(0),
  trainer_fee_type: z.enum(['percentage', 'amount']),
  trainer_fee_value: z.number().min(0),
  branchId: z.string().min(1, { message: "Branch is required" }),
});

export type ClassFormValues = z.infer<typeof classFormSchema>;
