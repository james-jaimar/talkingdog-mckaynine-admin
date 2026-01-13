
import { z } from "zod";

// Spay/neuter status options - for puppy class form compatibility
export const SPAY_NEUTER_OPTIONS = [
  { value: "When old enough", label: "When old enough" },
  { value: "Already done", label: "Already done" },
  { value: "Not planning to", label: "Not planning to" },
  // Legacy values from intake scans
  { value: "intact", label: "Intact" },
  { value: "spayed", label: "Spayed" },
  { value: "neutered", label: "Neutered" },
] as const;

// Form validation schema
export const formSchema = z.object({
  name: z.string().min(1, { message: "Dog's name is required" }),
  breed: z.string().min(1, { message: "Breed is required" }),
  age: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  date_of_birth: z.string().optional(),
  spay_neuter_status: z.string().optional(),
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
  date_of_birth?: string | null;
  spay_neuter_status?: string | null;
  notes?: string;
  behavior_notes?: string;
  medical_notes?: string;
  avatar_url?: string;
}
