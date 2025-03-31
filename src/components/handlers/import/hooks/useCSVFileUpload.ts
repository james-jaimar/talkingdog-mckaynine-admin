import { useState } from "react";
import { parseCSVFile, generateInitialMappings } from "../helpers/csv-parser";
import { FieldMapping } from "../types";

export function useCSVFileUpload() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCsvFile(file);
    
    parseCSVFile(file, (headers, data) => {
      // Process and clean data
      const cleanedData = data.map(row => {
        const cleanRow: Record<string, any> = {};
        
        // Process each field in the row
        Object.entries(row).forEach(([header, value]) => {
          // Handle boolean fields (preferences, class enrollments)
          if (typeof value === 'string' && 
              (header === 'WhatsApp' || 
               header === 'Photo Permission' ||
               header === 'PUPPY' ||
               header === 'EO' ||
               header === 'BRONZE CGC' ||
               header === 'SILVER CGC' ||
               header === 'BEGINNER/Novice' ||
               header === 'WT' ||
               header === 'YOGA')) {
            
            const lowerValue = value.toString().toLowerCase().trim();
            
            // Convert string values to true/false
            if (['yes', 'y', 'true', '1', 'enrolled', 'completed', 'grad'].some(v => lowerValue.includes(v))) {
              cleanRow[header] = true;
            } else if (['no', 'n', 'false', '0', '-', ''].includes(lowerValue)) {
              cleanRow[header] = false;
            } else {
              // Keep as is for other values
              cleanRow[header] = value;
            }
          } else if (value === '-' || value === '') {
            // Convert dashes and empty strings to null for better handling
            cleanRow[header] = null;
          } else {
            // Keep as is for other values
            cleanRow[header] = value;
          }
        });
        
        return cleanRow;
      });
      
      setCsvHeaders(headers);
      setCsvData(cleanedData);
      
      // Generate initial mappings
      const initialMappings = generateInitialMappings(headers);
      setFieldMappings(initialMappings);
    });
  };

  const handleMapField = (csvHeader: string, dbField: string) => {
    setFieldMappings(prev => {
      // If dbField is empty, remove the mapping
      if (!dbField) {
        const newMappings = { ...prev };
        delete newMappings[csvHeader];
        return newMappings;
      }
      
      return {
        ...prev,
        [csvHeader]: dbField
      };
    });
  };

  return {
    csvFile,
    csvHeaders,
    csvData,
    fieldMappings,
    handleFileChange,
    handleMapField
  };
}
