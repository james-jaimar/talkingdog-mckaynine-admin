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
            // Handle empty values or dashes
            if (value === '-' || value === '') {
              cleanedRow[key] = null;
            } else {
              // Convert 'yes/no' text to boolean for class enrollments and preferences
              if (typeof value === 'string' && 
                  (key === 'WhatsApp' || key === 'Photo Permission' || 
                   key === 'PUPPY' || key === 'EO' || key === 'BRONZE CGC' || 
                   key === 'SILVER CGC' || key === 'BEGINNER/Novice' || 
                   key === 'WT' || key === 'YOGA')) {
                
                const lowerValue = value.toLowerCase();
                if (lowerValue === 'yes' || lowerValue === '1' || lowerValue === 'true' || 
                    lowerValue.includes('enrolled') || lowerValue.includes('grad') || 
                    lowerValue.includes('completed') || lowerValue.includes('term')) {
                  cleanedRow[key] = true;
                } else if (lowerValue === 'no' || lowerValue === '0' || lowerValue === 'false') {
                  cleanedRow[key] = false;
                } else {
                  // Keep the original value if it doesn't match known patterns
                  cleanedRow[key] = value;
                }
              } else {
                cleanedRow[key] = value;
              }
            }
          });
          return cleanedRow;
        });
        
        onSuccess(headers, cleanedData);
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
  
  // Map common fields automatically
  const commonMappings: Record<string, RegExp | string> = {
    // Client fields
    "name": /^name$/i,
    "clients.name": /^name$/i,
    "clients.email": /^e-mail$|^email$/i,
    "clients.phone": /^tel$|^phone$/i,
    "clients.notes": /^comments$/i,
    "clients.whatsapp": /^whatsapp$/i,
    "clients.photo_permission": /^photo\s*permission$/i,
    
    // Dog fields
    "dogs.name": /^dog'?s?\s*name$/i,
    "dogs.breed": /^breed$/i,
    "dogs.date_of_birth": /^dob$|^date\s*of\s*birth$/i,
    "dogs.notes": /^assess$/i,
    
    // Class enrollment fields
    "class_enrollments.puppy_class": /^puppy$/i,
    "class_enrollments.eo_class": /^eo$/i,
    "class_enrollments.bronze_cgc_class": /^bronze\s*cgc$/i,
    "class_enrollments.silver_cgc_class": /^silver\s*cgc$/i,
    "class_enrollments.beginner_novice_class": /^beginner\/novice$/i,
    "class_enrollments.wt_class": /^wt$/i,
    "class_enrollments.yoga_class": /^yoga$/i
  };

  // Process each header against the mapping patterns
  headers.forEach(header => {
    const normalizedHeader = header.trim();
    
    // Check each mapping pattern against the header
    for (const [dbField, pattern] of Object.entries(commonMappings)) {
      if (typeof pattern === 'string') {
        if (normalizedHeader.toLowerCase() === pattern.toLowerCase()) {
          initialMappings[normalizedHeader] = dbField;
          break;
        }
      } else if (pattern instanceof RegExp) {
        if (pattern.test(normalizedHeader)) {
          initialMappings[normalizedHeader] = dbField;
          break;
        }
      }
    }
  });
  
  // Ensure critical fields are mapped even if patterns didn't match exactly
  headers.forEach(header => {
    const headerLower = header.toLowerCase().trim();
    
    // Name field
    if (headerLower === 'name' && !initialMappings[header]) {
      initialMappings[header] = 'clients.name';
    }
    
    // Email field
    if ((headerLower.includes('email') || headerLower.includes('e-mail')) && !Object.values(initialMappings).includes('clients.email')) {
      initialMappings[header] = 'clients.email';
    }
    
    // Phone field
    if ((headerLower.includes('phone') || headerLower === 'tel') && !Object.values(initialMappings).includes('clients.phone')) {
      initialMappings[header] = 'clients.phone';
    }
    
    // Dog name field
    if ((headerLower.includes('dog') && headerLower.includes('name')) && !Object.values(initialMappings).includes('dogs.name')) {
      initialMappings[header] = 'dogs.name';
    }
    
    // Breed field
    if (headerLower === 'breed' && !Object.values(initialMappings).includes('dogs.breed')) {
      initialMappings[header] = 'dogs.breed';
    }
    
    // DOB field
    if (headerLower === 'dob' && !Object.values(initialMappings).includes('dogs.date_of_birth')) {
      initialMappings[header] = 'dogs.date_of_birth';
    }
    
    // Notes/Comments field
    if (headerLower === 'comments' && !Object.values(initialMappings).includes('clients.notes')) {
      initialMappings[header] = 'clients.notes';
    }
    
    // Assessment field for dog notes
    if (headerLower === 'assess' && !Object.values(initialMappings).includes('dogs.notes')) {
      initialMappings[header] = 'dogs.notes';
    }
    
    // WhatsApp preference
    if (headerLower.includes('whatsapp') && !Object.values(initialMappings).includes('clients.whatsapp')) {
      initialMappings[header] = 'clients.whatsapp';
    }
    
    // Photo permission
    if (headerLower.includes('photo') && headerLower.includes('permission') && !Object.values(initialMappings).includes('clients.photo_permission')) {
      initialMappings[header] = 'clients.photo_permission';
    }
    
    // Class enrollment fields
    const classFields = {
      'puppy': 'class_enrollments.puppy_class',
      'eo': 'class_enrollments.eo_class',
      'bronze cgc': 'class_enrollments.bronze_cgc_class',
      'bronze': 'class_enrollments.bronze_cgc_class',
      'silver cgc': 'class_enrollments.silver_cgc_class',
      'silver': 'class_enrollments.silver_cgc_class',
      'beginner/novice': 'class_enrollments.beginner_novice_class',
      'beginner': 'class_enrollments.beginner_novice_class',
      'novice': 'class_enrollments.beginner_novice_class',
      'wt': 'class_enrollments.wt_class',
      'yoga': 'class_enrollments.yoga_class'
    };
    
    for (const [classKey, dbField] of Object.entries(classFields)) {
      if (headerLower === classKey || headerLower.includes(classKey)) {
        if (!Object.values(initialMappings).includes(dbField)) {
          initialMappings[header] = dbField;
        }
      }
    }
  });
  
  return initialMappings;
};
