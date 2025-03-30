
import { useState } from "react";
import { FieldMapping } from "../types";
import { processClientData } from "../helpers/clientHelpers";
import { processDogData } from "../helpers/dogHelpers";
import { processClassEnrollments } from "../helpers/classHelpers";

export function useDataImport() {
  const [isUploading, setIsUploading] = useState(false);

  const processImport = async (
    data: any[],
    fieldMappings: FieldMapping,
    branchId?: string
  ) => {
    console.log("processImport called with:", { dataLength: data.length, fieldMappings, branchId });
    setIsUploading(true);
    
    try {
      const errors: string[] = [];
      
      // Group fieldMappings by table
      const tableFields: Record<string, Record<string, string>> = {};
      
      Object.entries(fieldMappings).forEach(([csvHeader, dbFieldWithTable]) => {
        if (!dbFieldWithTable) return; // Skip unmapped fields
        
        const [table, field] = dbFieldWithTable.split('.');
        if (!table || !field) return;
        
        if (!tableFields[table]) {
          tableFields[table] = {};
        }
        
        tableFields[table][field] = csvHeader;
      });
      
      console.log("Grouped field mappings by table:", tableFields);
      
      // Process data in batches
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        console.log(`Processing row ${i+1}/${data.length}`);
        
        try {
          // Process client data first
          const clientFields = tableFields['clients'] || {};
          if (Object.keys(clientFields).length > 0) {
            console.log("Processing client data for row", i+1);
            const clientId = await processClientData(row, clientFields, branchId);
            
            // Process dog data
            const dogFields = tableFields['dogs'] || {};
            if (Object.keys(dogFields).length > 0 && clientId) {
              console.log("Processing dog data for row", i+1);
              const dogId = await processDogData(row, dogFields, clientId);
              
              // Process class enrollments
              const classFields = tableFields['class_enrollments'] || {};
              if (Object.keys(classFields).length > 0 && dogId) {
                console.log("Processing class enrollments for row", i+1);
                await processClassEnrollments(row, classFields, dogId);
              }
            }
          }
        } catch (error: any) {
          console.error(`Error processing row ${i+1}:`, error);
          errors.push(`Row ${i+1}: ${error.message || 'Unknown error'}`);
        }
      }
      
      console.log("Import process completed with", errors.length, "errors");
      
      return {
        success: errors.length < data.length, // Consider success if at least one row was imported
        errors
      };
    } catch (error: any) {
      console.error("Error in processImport:", error);
      return {
        success: false,
        errors: [error.message || 'An unexpected error occurred']
      };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    processImport
  };
}
