import { z } from "zod";

// Step 1: Privacy & Consent
export const privacySchema = z.object({
  privacyPolicyAgreed: z.boolean().refine(val => val === true, {
    message: "You must agree to the privacy policy to continue"
  }),
});

// Step 2: Owner Details
export const ownerSchema = z.object({
  ownerName: z.string().min(2, "Name is required"),
  accountHolderName: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(5, "Phone number is required"),
  occupation: z.string().optional(),
  vetName: z.string().min(1, "Please tell us which vet you use"),
});

// Step 3: Dog Details
export const dogSchema = z.object({
  dogName: z.string().min(1, "Dog's name is required"),
  birthDate: z.string().min(1, "Birth date is required"),
  gender: z.enum(["Male", "Female"], { required_error: "Please select gender" }),
  breed: z.string().min(1, "Breed is required"),
  spayNeuterStatus: z.enum(["When old enough", "Already done", "Not planning"], {
    required_error: "Please select spay/neuter status"
  }),
  acquiredFrom: z.enum([
    "KUSA", "Breeder", "SPCA/AACL", "Rescue org", "Family/friends", 
    "Advert", "Born in home", "Stray", "Other"
  ], { required_error: "Please select where you acquired your dog" }),
  acquiredFromOther: z.string().optional(),
  ageAtAcquisition: z.enum([
    "Less than 2 months", "2-4 months", "4-12 months", "Older than 1 year"
  ], { required_error: "Please select age at acquisition" }),
});

// Step 4: Home & Social Life
export const homeSchema = z.object({
  otherPets: z.object({
    dogs: z.boolean().default(false),
    cats: z.boolean().default(false),
    birds: z.boolean().default(false),
    livestock: z.boolean().default(false),
  }),
  childrenAtHome: z.enum(["Babies/toddlers", "Children", "Teenagers", "None"], {
    required_error: "Please select children at home option"
  }),
  socialBehavior: z.object({
    dogs: z.enum(["Great", "OK", "Not good"]),
    animals: z.enum(["Great", "OK", "Not good"]),
    people: z.enum(["Great", "OK", "Not good"]),
  }),
  socialBehaviorDetails: z.string().optional(),
});

// Step 5: Training Goals & Health
export const trainingSchema = z.object({
  trainingGoal: z.enum(["Competitive dog sport", "Chilled canine companion"], {
    required_error: "Please select your training goal"
  }),
  hasBehaviorProblems: z.boolean().default(false),
  behaviorProblemsDetails: z.string().optional(),
  hasHealthProblems: z.boolean().default(false),
  healthProblemsDetails: z.string().optional(),
  vetClearanceFile: z.any().optional(), // File upload handled separately
});

// Step 6: Class & Permissions
export const classSchema = z.object({
  classType: z.enum(["Puppy", "Elementary", "Obedience", "CGC Bronze", "Other"], {
    required_error: "Please select a class type"
  }),
  classTypeOther: z.string().optional(),
  branchId: z.string().min(1, "Please select a branch"),
  heardFrom: z.object({
    google: z.boolean().default(false),
    vet: z.boolean().default(false),
    friends: z.boolean().default(false),
    breeder: z.boolean().default(false),
    beenBefore: z.boolean().default(false),
  }),
  whatsappPermission: z.enum(["yes", "no", "unsure"]),
  photoPermission: z.enum(["yes", "no", "unsure"]),
  onleadSocializingAcknowledged: z.boolean().refine(val => val === true, {
    message: "Please acknowledge this requirement"
  }),
  equipmentSupervisionAcknowledged: z.boolean().refine(val => val === true, {
    message: "Please acknowledge this requirement"
  }),
  trainingEquipmentAcknowledged: z.boolean().refine(val => val === true, {
    message: "Please acknowledge this requirement"
  }),
  treatsAcknowledged: z.boolean().refine(val => val === true, {
    message: "Please acknowledge this requirement"
  }),
  wasteDisposalAcknowledged: z.boolean().refine(val => val === true, {
    message: "Please acknowledge this requirement"
  }),
  termsAgreed: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  }),
  signatureName: z.string().min(1, "Please enter your name"),
  signatureDate: z.string().min(1, "Please enter the date"),
});

// Combined schema for complete form
export const fullEnrollmentSchema = privacySchema
  .merge(ownerSchema)
  .merge(dogSchema)
  .merge(homeSchema)
  .merge(trainingSchema)
  .merge(classSchema);

export type PrivacyFormValues = z.infer<typeof privacySchema>;
export type OwnerFormValues = z.infer<typeof ownerSchema>;
export type DogFormValues = z.infer<typeof dogSchema>;
export type HomeFormValues = z.infer<typeof homeSchema>;
export type TrainingFormValues = z.infer<typeof trainingSchema>;
export type ClassFormValues = z.infer<typeof classSchema>;
export type FullEnrollmentFormValues = z.infer<typeof fullEnrollmentSchema>;

// Default values for the form
export const defaultFormValues: Partial<FullEnrollmentFormValues> = {
  privacyPolicyAgreed: false,
  ownerName: "",
  accountHolderName: "",
  email: "",
  phone: "",
  occupation: "",
  vetName: "",
  dogName: "",
  birthDate: "",
  breed: "",
  otherPets: { dogs: false, cats: false, birds: false, livestock: false },
  socialBehavior: { dogs: "Great", animals: "Great", people: "Great" },
  socialBehaviorDetails: "",
  hasBehaviorProblems: false,
  behaviorProblemsDetails: "",
  hasHealthProblems: false,
  healthProblemsDetails: "",
  heardFrom: { google: false, vet: false, friends: false, breeder: false, beenBefore: false },
  whatsappPermission: "unsure",
  photoPermission: "unsure",
  onleadSocializingAcknowledged: false,
  equipmentSupervisionAcknowledged: false,
  trainingEquipmentAcknowledged: false,
  treatsAcknowledged: false,
  wasteDisposalAcknowledged: false,
  termsAgreed: false,
  signatureName: "",
  signatureDate: "",
};
