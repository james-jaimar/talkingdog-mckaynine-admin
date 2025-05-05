
import { z } from "zod";

export const classScheduleFormSchema = z.object({
  trainerId: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  selectedDates: z.array(z.date()).min(1, "Please select at least one date"),
  isRecurring: z.boolean().default(false),
  referenceTitle: z.string().min(1, "Please enter a reference title"),
  spansMultipleTerms: z.boolean().default(false),
  relatedTermIds: z.array(z.string()).optional(),
});

export type ClassScheduleFormValues = z.infer<typeof classScheduleFormSchema>;
