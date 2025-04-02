
import * as z from "zod";

export const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  dogName: z.string().min(1, {
    message: "Dog name is required.",
  }),
  breed: z.string().min(1, {
    message: "Breed is required.",
  }),
  dogDob: z.string().optional(),
  assessment: z.string().optional(),
  comments: z.string().optional(),
  whatsApp: z.boolean().default(false),
  photoPermission: z.boolean().default(false),
  classEnrollment: z.string().optional(),
  puppyClass: z.string().optional(),
  eoClass: z.string().optional(),
  bronzeCgcClass: z.string().optional(),
  silverCgcClass: z.string().optional(),
  beginnerNoviceClass: z.string().optional(),
  wtClass: z.string().optional(),
  yogaClass: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;
