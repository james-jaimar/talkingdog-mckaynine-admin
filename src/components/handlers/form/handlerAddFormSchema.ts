
import * as z from "zod";

export const formSchema = z.object({
  // Handler personal info
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  
  // Branch selection
  branch_id: z.string().optional(),
  
  // Dog basic info
  dogName: z.string().min(1, {
    message: "Dog name is required.",
  }),
  breed: z.string().min(1, {
    message: "Breed is required.",
  }),
  dogDob: z.string().optional(),
  dogAge: z.string().optional(),
  assessment: z.string().optional(),
  
  // Puppy class specific fields
  puppyVaccinated: z.boolean().default(false),
  puppyVaccinationDate: z.string().optional(),
  puppyMicrochipped: z.boolean().default(false),
  puppyMicrochipNumber: z.string().optional(),
  puppyVetName: z.string().optional(),
  puppyVetPhone: z.string().optional(),
  puppyVetAddress: z.string().optional(),
  puppyDewormingDate: z.string().optional(),
  puppyDiet: z.string().optional(),
  puppyPreviousTraining: z.string().optional(),
  puppyBehaviorIssues: z.string().optional(),
  puppyMedicalConditions: z.string().optional(),
  
  // Indemnity agreement
  indemnityAgreement: z.boolean().default(false),
  
  // Preferences and class enrollment
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
  aTestClass: z.string().optional(), // Added A-Test class
  yogaClass: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;
