
import { z } from "zod";

export const branchFormSchema = z.object({
  name: z.string().min(2, "Branch name must be at least 2 characters."),
  address: z.string().min(5, "Address must be at least 5 characters."),
  city: z.string().min(2, "City must be at least 2 characters."),
  postalCode: z.string().min(2, "Postal code must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  capacity: z.coerce.number().positive("Capacity must be a positive number").int("Capacity must be a whole number").optional(),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;

export const defaultBranchFormValues: BranchFormValues = {
  name: "",
  address: "",
  city: "",
  postalCode: "",
  email: "",
  phone: "",
  capacity: 10,
};
