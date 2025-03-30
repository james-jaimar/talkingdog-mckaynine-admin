
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
        
        // Preprocess data to clean up empty values and dashes
        const cleanedData = results.data.map(row => {
          const cleanedRow: Record<string, any> = {};
          Object.entries(row).forEach(([key, value]) => {
            if (value === '-' || value === '') {
              cleanedRow[key] = null;
            } else {
              cleanedRow[key] = value;
            }
          });
          return cleanedRow;
        });
        
        onSuccess(headers, cleanedData);
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
    // Client fields
    "Name": "clients.name",
    "E-mail": "clients.email",
    "Tel": "clients.phone",
    "COMMENTS": "clients.notes",
    "WhatsApp": "clients.whatsapp",
    "Photo Permission": "clients.photo_permission",
    "Photo Pemission": "clients.photo_permission",
    
    // Dog fields
    "Dog's Name": "dogs.name",
    "Breed": "dogs.breed",
    "DOB": "dogs.date_of_birth",
    "Assess": "dogs.notes",
    
    // Class enrollment fields
    "PUPPY": "class_enrollments.puppy_class",
    "EO": "class_enrollments.eo_class",
    "BRONZE CGC": "class_enrollments.bronze_cgc_class",
    "SILVER CGC": "class_enrollments.silver_cgc_class",
    "BEGINNER/Novice": "class_enrollments.beginner_novice_class",
    "WT": "class_enrollments.wt_class",
    "YOGA": "class_enrollments.yoga_class"
  };
  
  // Try direct case-insensitive match first
  headers.forEach(header => {
    const normalizedHeader = header.trim();
    
    // Try exact match
    if (commonMappings[normalizedHeader]) {
      initialMappings[normalizedHeader] = commonMappings[normalizedHeader];
      return;
    }
    
    // Try case-insensitive match
    for (const [key, value] of Object.entries(commonMappings)) {
      if (key.toLowerCase() === normalizedHeader.toLowerCase()) {
        initialMappings[normalizedHeader] = value;
        return;
      }
    }
    
    // Try to match by substring
    for (const [key, value] of Object.entries(commonMappings)) {
      if (normalizedHeader.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(normalizedHeader.toLowerCase())) {
        initialMappings[normalizedHeader] = value;
        return;
      }
    }
    
    // Special case for fields that might be uniquely named
    const headerLower = normalizedHeader.toLowerCase();
    
    if (headerLower.includes('email') || headerLower.includes('e-mail')) {
      initialMappings[normalizedHeader] = 'clients.email';
    }
    
    if (headerLower.includes('phone') || headerLower.includes('tel')) {
      initialMappings[normalizedHeader] = 'clients.phone';
    }
    
    if (headerLower.includes('dog') && headerLower.includes('name')) {
      initialMappings[normalizedHeader] = 'dogs.name';
    }
    
    if (headerLower === 'breed' || headerLower.includes('breed')) {
      initialMappings[normalizedHeader] = 'dogs.breed';
    }
    
    if (headerLower === 'dob' || headerLower.includes('date of birth')) {
      initialMappings[normalizedHeader] = 'dogs.date_of_birth';
    }
    
    if (headerLower === 'comments' || headerLower.includes('comment')) {
      initialMappings[normalizedHeader] = 'clients.notes';
    }
    
    if (headerLower === 'assess' || headerLower.includes('assessment')) {
      initialMappings[normalizedHeader] = 'dogs.notes';
    }
    
    if (headerLower.includes('whatsapp')) {
      initialMappings[normalizedHeader] = 'clients.whatsapp';
    }
    
    if (headerLower.includes('photo') && headerLower.includes('permission')) {
      initialMappings[normalizedHeader] = 'clients.photo_permission';
    }
    
    // Class enrollment fields
    if (headerLower === 'puppy') {
      initialMappings[normalizedHeader] = 'class_enrollments.puppy_class';
    }
    
    if (headerLower === 'eo') {
      initialMappings[normalizedHeader] = 'class_enrollments.eo_class';
    }
    
    if (headerLower.includes('bronze')) {
      initialMappings[normalizedHeader] = 'class_enrollments.bronze_cgc_class';
    }
    
    if (headerLower.includes('silver')) {
      initialMappings[normalizedHeader] = 'class_enrollments.silver_cgc_class';
    }
    
    if (headerLower.includes('beginner') || headerLower.includes('novice')) {
      initialMappings[normalizedHeader] = 'class_enrollments.beginner_novice_class';
    }
    
    if (headerLower === 'wt') {
      initialMappings[normalizedHeader] = 'class_enrollments.wt_class';
    }
    
    if (headerLower === 'yoga') {
      initialMappings[normalizedHeader] = 'class_enrollments.yoga_class';
    }
  });
  
  return initialMappings;
};
