
import { MappingField, PreferenceField } from "./types";

export const availableFields: MappingField[] = [
  // Client fields
  { csvHeader: "Name", dbField: "name", table: "clients", required: true },
  { csvHeader: "E-mail", dbField: "email", table: "clients", required: true },
  { csvHeader: "Tel", dbField: "phone", table: "clients", required: false },
  { csvHeader: "COMMENTS", dbField: "notes", table: "clients", required: false },
  { csvHeader: "WhatsApp", dbField: "whatsapp", table: "clients", required: false, description: "Preference for WhatsApp", dataType: 'boolean' },
  { csvHeader: "Photo Permission", dbField: "photo_permission", table: "clients", required: false, description: "Permission to use photos", dataType: 'boolean' },
  
  // Dog fields
  { csvHeader: "Dog's Name", dbField: "name", table: "dogs", required: true },
  { csvHeader: "Breed", dbField: "breed", table: "dogs", required: true },
  { csvHeader: "DOB", dbField: "date_of_birth", table: "dogs", required: false, description: "Date of birth", dataType: 'date' },
  { csvHeader: "Assess", dbField: "notes", table: "dogs", required: false },
  
  // Class enrollment fields - now properly defined as their own fields
  { csvHeader: "PUPPY", dbField: "puppy_class", table: "class_enrollments", required: false, description: "Puppy class enrollment" },
  { csvHeader: "EO", dbField: "eo_class", table: "class_enrollments", required: false, description: "EO class enrollment" },
  { csvHeader: "BRONZE CGC", dbField: "bronze_cgc_class", table: "class_enrollments", required: false, description: "Bronze CGC class enrollment" },
  { csvHeader: "SILVER CGC", dbField: "silver_cgc_class", table: "class_enrollments", required: false, description: "Silver CGC class enrollment" },
  { csvHeader: "BEGINNER/Novice", dbField: "beginner_novice_class", table: "class_enrollments", required: false, description: "Beginner/Novice class enrollment" },
  { csvHeader: "WT", dbField: "wt_class", table: "class_enrollments", required: false, description: "WT class enrollment" },
  { csvHeader: "YOGA", dbField: "yoga_class", table: "class_enrollments", required: false, description: "Yoga class enrollment" },
];

// Define client preference fields for special handling
export const clientPreferences: PreferenceField[] = [
  { name: "WhatsApp", column: "whatsapp", description: "Prefers WhatsApp for communication" },
  { name: "Photo Permission", column: "photo_permission", description: "Photo permission granted" }
];

// Define class enrollment fields for special handling
export const classEnrollments: PreferenceField[] = [
  { name: "PUPPY", column: "puppy_class", description: "Puppy class" },
  { name: "EO", column: "eo_class", description: "EO class" },
  { name: "BRONZE CGC", column: "bronze_cgc_class", description: "Bronze CGC class" },
  { name: "SILVER CGC", column: "silver_cgc_class", description: "Silver CGC class" },
  { name: "BEGINNER/Novice", column: "beginner_novice_class", description: "Beginner/Novice class" },
  { name: "WT", column: "wt_class", description: "WT class" },
  { name: "YOGA", column: "yoga_class", description: "Yoga class" }
];
