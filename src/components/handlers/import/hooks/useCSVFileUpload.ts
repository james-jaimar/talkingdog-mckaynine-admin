
import { useState } from "react";
import { parseCSVFile, generateInitialMappings } from "../helpers/csv-parser";
import { FieldMapping } from "../types";
import { availableFields } from "../fieldDefinitions";

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
      setCsvHeaders(headers);
      setCsvData(data);
      
      // Initialize field mappings with best guesses
      const initialMappings = generateInitialMappings(headers);
      
      // Try fuzzy matching for any headers not directly matched
      headers.forEach(header => {
        if (!initialMappings[header]) {
          const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          // Find potential matches
          const match = availableFields.find(field => {
            const normalizedField = field.dbField.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader);
          });
          
          if (match) {
            initialMappings[header] = `${match.table}.${match.dbField}`;
          }
        }
      });
      
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
    handleMapField,
    setFieldMappings
  };
}
