
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
  
  // Map common fields automatically
  const commonMappings: Record<string, string> = {
    "Name": "clients.name",
    "E-mail": "clients.email",
    "Tel": "clients.phone",
    "Dog's Name": "dogs.name",
    "Breed": "dogs.breed",
    "DOB": "dogs.date_of_birth",
    "Assess": "dogs.notes",
    "COMMENTS": "clients.notes",
    "WhatsApp": "clients.whatsapp",
    "Photo Permission": "clients.photo_permission",
    "PUPPY": "class_enrollments.puppy_class",
    "EO": "class_enrollments.eo_class",
    "BRONZE CGC": "class_enrollments.bronze_cgc_class",
    "SILVER CGC": "class_enrollments.silver_cgc_class",
    "BEGINNER/Novice": "class_enrollments.beginner_novice_class",
    "WT": "class_enrollments.wt_class",
    "YOGA": "class_enrollments.yoga_class"
  };
  
  headers.forEach(header => {
    // Try to match headers to common mappings
    if (commonMappings[header]) {
      initialMappings[header] = commonMappings[header];
    }
  });
  
  return initialMappings;
};
