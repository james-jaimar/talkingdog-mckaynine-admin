
import { z } from "zod";

// Form validation schema
export const formSchema = z.object({
  name: z.string().min(1, { message: "Dog's name is required" }),
  breed: z.string().min(1, { message: "Breed is required" }),
  age: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  date_of_birth: z.string().optional(),
  notes: z.string().optional(),
  behavior_notes: z.string().optional(),
  medical_notes: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

export interface DogData {
  id?: string;
  name: string;
  breed: string;
  age?: number;
  weight?: number;
  date_of_birth?: string;
  notes?: string;
  behavior_notes?: string;
  medical_notes?: string;
  avatar_url?: string;
}
