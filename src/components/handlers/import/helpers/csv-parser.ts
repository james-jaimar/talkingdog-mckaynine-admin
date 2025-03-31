
import Papa from "papaparse";
import { toast } from "@/hooks/use-toast";

// Parse the CSV file and extract headers and data
export const parseCSVFile = (
  file: File,
  onSuccess: (headers: string[], data: any[]) => void
) => {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      if (results.data.length > 0) {
        // Extract headers from the first row
        const headers = Object.keys(results.data[0]);
        onSuccess(headers, results.data);
      } else {
        toast({
          title: "Empty CSV file",
          description: "The CSV file doesn't contain any data",
          variant: "destructive"
        });
      }
    },
    error: (error) => {
      toast({
        title: "Error parsing CSV",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};

// Generate initial field mappings based on CSV headers
export const generateInitialMappings = (headers: string[]) => {
  const initialMappings: Record<string, string> = {};
  
  const knownMappings: Record<string, RegExp> = {
    // Client fields
    "clients.name": /^name$/i,
    "clients.email": /^e-mail$|^email$/i,
    "clients.phone": /^tel$|^phone$|^telephone$/i,
    "clients.notes": /^comments$/i,
    
    // Dog fields
    "dogs.name": /^dog'?s?\s*name$/i,
    "dogs.breed": /^breed$/i,
    "dogs.date_of_birth": /^dob$|^date\s*of\s*birth$/i,
    "dogs.notes": /^assess(?:ment)?$/i,
    
    // Class enrollment fields
    "class_enrollments.puppy_class": /^puppy$/i,
    "class_enrollments.eo_class": /^eo$/i,
    "class_enrollments.bronze_cgc_class": /^bronze\s*cgc$/i,
    "class_enrollments.silver_cgc_class": /^silver\s*cgc$/i,
    "class_enrollments.beginner_novice_class": /^beginner\/novice$|^beginner$|^novice$/i,
    "class_enrollments.wt_class": /^wt$/i,
    "class_enrollments.yoga_class": /^yoga$/i,
    
    // Preferences
    "preferences.whatsapp": /^whatsapp$/i,
    "preferences.photo_permission": /^photo\s*permission$/i
  };

  // Auto-map fields based on patterns
  headers.forEach(header => {
    for (const [dbField, pattern] of Object.entries(knownMappings)) {
      if (pattern.test(header)) {
        initialMappings[header] = dbField;
        break;
      }
    }
  });
  
  return initialMappings;
};
