
import { z } from "zod";

export const classScheduleFormSchema = z.object({
  trainerId: z.string().min(1, "Trainer is required"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  startTime: z.string().min(1, "Start time is required"),
  endDate: z.date({
    required_error: "End date is required",
  }),
  endTime: z.string().min(1, "End time is required"),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.string().optional(),
  referenceTitle: z.string().min(1, "Reference title is required"),
  selectedDates: z.array(z.date()).optional(),
});

export type ClassScheduleFormValues = z.infer<typeof classScheduleFormSchema>;
