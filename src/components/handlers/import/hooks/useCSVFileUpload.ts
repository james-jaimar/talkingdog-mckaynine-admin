
import { useState } from "react";
import Papa from "papaparse";
import { toast } from "@/hooks/use-toast";
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
    
    // Parse the file
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          toast({
            title: "Empty CSV file",
            description: "The CSV file doesn't contain any data",
            variant: "destructive"
          });
          return;
        }

        // Extract headers and clean data
        const headers = Object.keys(results.data[0]);
        setCsvHeaders(headers);
        setCsvData(results.data);
        
        // Generate initial mappings by matching headers to defined fields
        const initialMappings: FieldMapping = {};
        
        // Try to match headers with defined fields
        for (const header of headers) {
          for (const field of availableFields) {
            // Case-insensitive comparison
            if (field.csvHeader.toLowerCase() === header.toLowerCase()) {
              initialMappings[header] = `${field.table}.${field.dbField}`;
              break;
            }
          }
        }
        
        // Additionally, try to match fields by their name if not matched by csvHeader
        for (const header of headers) {
          if (initialMappings[header]) continue; // Skip already mapped fields
          
          for (const field of availableFields) {
            if (field.dbField.toLowerCase() === header.toLowerCase()) {
              initialMappings[header] = `${field.table}.${field.dbField}`;
              break;
            }
          }
        }
        
        setFieldMappings(initialMappings);
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

  const handleMapField = (csvHeader: string, dbField: string) => {
    setFieldMappings(prev => {
      // If dbField is empty, remove the mapping
      if (!dbField) {
        const newMappings = { ...prev };
        delete newMappings[csvHeader];
        return newMappings;
      }
      
      // Check if this field is already mapped to another header
      const existingHeaderForField = Object.entries(prev)
        .find(([_, value]) => value === dbField)?.[0];
        
      if (existingHeaderForField && existingHeaderForField !== csvHeader) {
        // Create a new mapping object without the old mapping
        const newMappings = { ...prev };
        delete newMappings[existingHeaderForField];
        return { ...newMappings, [csvHeader]: dbField };
      }
      
      // Add or update the mapping
      return { ...prev, [csvHeader]: dbField };
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
