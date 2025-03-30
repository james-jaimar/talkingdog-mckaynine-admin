
import { MappingField } from "./types";

export const availableFields: MappingField[] = [
  // Client fields
  { csvHeader: "Name", dbField: "name", table: "clients", required: true },
  { csvHeader: "E-mail", dbField: "email", table: "clients", required: true },
  { csvHeader: "Tel", dbField: "phone", table: "clients", required: false },
  { csvHeader: "COMMENTS", dbField: "notes", table: "clients", required: false },
  { csvHeader: "WhatsApp", dbField: "whatsapp", table: "clients", required: false, description: "Preference for WhatsApp" },
  { csvHeader: "Photo Permission", dbField: "photo_permission", table: "clients", required: false, description: "Permission to use photos" },
  
  // Dog fields
  { csvHeader: "Dog's Name", dbField: "name", table: "dogs", required: true },
  { csvHeader: "Breed", dbField: "breed", table: "dogs", required: true },
  { csvHeader: "DOB", dbField: "age", table: "dogs", required: false, description: "Will be calculated from DOB" },
  { csvHeader: "Assess", dbField: "notes", table: "dogs", required: false },
  
  // Class enrollment fields
  { csvHeader: "PUPPY", dbField: "puppy_class", table: "classes", required: false },
  { csvHeader: "EO", dbField: "eo_class", table: "classes", required: false },
  { csvHeader: "BRONZE CGC", dbField: "bronze_cgc_class", table: "classes", required: false },
  { csvHeader: "SILVER CGC", dbField: "silver_cgc_class", table: "classes", required: false },
  { csvHeader: "BEGINNER/Novice", dbField: "beginner_novice_class", table: "classes", required: false },
  { csvHeader: "WT", dbField: "wt_class", table: "classes", required: false },
  { csvHeader: "YOGA", dbField: "yoga_class", table: "classes", required: false },
];
