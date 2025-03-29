
import { z } from "zod";

export const branchFormSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  capacity: z.number().min(1, "Capacity must be at least 1").default(10),
  adminId: z.string().optional().or(z.literal("")),
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
  adminId: "",
};
