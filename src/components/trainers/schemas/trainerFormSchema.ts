
import { z } from "zod";

export const trainerFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().optional().or(z.literal("")),
  branchIds: z.array(z.string()).default([]),
  specialties: z.array(z.string()).default([]),
  bio: z.string().optional().or(z.literal("")),
});

export type TrainerFormValues = z.infer<typeof trainerFormSchema>;
