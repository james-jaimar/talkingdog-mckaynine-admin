
import { MappingField } from "./types";

export const availableFields: MappingField[] = [
  // Client fields
  { csvHeader: "Name", dbField: "name", table: "clients", required: true },
  { csvHeader: "E-mail", dbField: "email", table: "clients", required: true },
  { csvHeader: "Tel", dbField: "phone", table: "clients", required: false },
  { csvHeader: "COMMENTS", dbField: "notes", table: "clients", required: false },
  
  // Dog fields
  { csvHeader: "Dog's Name", dbField: "name", table: "dogs", required: true },
  { csvHeader: "Breed", dbField: "breed", table: "dogs", required: true },
  { csvHeader: "DOB", dbField: "date_of_birth", table: "dogs", required: false, description: "Date of birth", dataType: 'date' },
  { csvHeader: "Assess", dbField: "notes", table: "dogs", required: false },
  
  // Class enrollment fields
  { csvHeader: "PUPPY", dbField: "puppy_class", table: "class_enrollments", required: false, description: "Puppy class enrollment" },
  { csvHeader: "EO", dbField: "eo_class", table: "class_enrollments", required: false, description: "EO class enrollment" },
  { csvHeader: "BRONZE CGC", dbField: "bronze_cgc_class", table: "class_enrollments", required: false, description: "Bronze CGC class enrollment" },
  { csvHeader: "SILVER CGC", dbField: "silver_cgc_class", table: "class_enrollments", required: false, description: "Silver CGC class enrollment" },
  { csvHeader: "BEGINNER/Novice", dbField: "beginner_novice_class", table: "class_enrollments", required: false, description: "Beginner/Novice class enrollment" },
  { csvHeader: "WT", dbField: "wt_class", table: "class_enrollments", required: false, description: "WT class enrollment" },
  { csvHeader: "YOGA", dbField: "yoga_class", table: "class_enrollments", required: false, description: "Yoga class enrollment" },
  
  // Preferences (handled differently in code)
  { csvHeader: "WhatsApp", dbField: "whatsapp", table: "preferences", required: false, description: "WhatsApp preference" },
  { csvHeader: "Photo Permission", dbField: "photo_permission", table: "preferences", required: false, description: "Photo permission" },
];
