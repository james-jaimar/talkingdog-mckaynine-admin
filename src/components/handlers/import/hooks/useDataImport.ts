
import { useState } from "react";
import { FieldMapping } from "../types";
import { processClientData } from "../helpers/clientHelpers";
import { processDogData } from "../helpers/dogHelpers";
import { processClassEnrollments } from "../helpers/classHelpers";
import { toast } from "@/hooks/use-toast";

export function useDataImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [processingResults, setProcessingResults] = useState<{
    total: number;
    processed: number;
    errors: { row: number; message: string }[];
  }>({ total: 0, processed: 0, errors: [] });

  const processImport = async (
    data: any[],
    fieldMappings: FieldMapping,
    branchId?: string
  ) => {
    // First, validate email mapping - this is critical
    const emailMapping = Object.entries(fieldMappings).find(
      ([_, value]) => value === 'clients.email'
    );
    
    if (!emailMapping) {
      toast({
        title: "Import failed",
        description: "Email field must be mapped for client import",
        variant: "destructive"
      });
      
      return {
        success: false,
        errors: ['Email field must be mapped for client import']
      };
    }
    
    const [emailHeader] = emailMapping;
    
    setIsUploading(true);
    setProcessingResults({ total: data.length, processed: 0, errors: [] });
    
    try {
      const errors: { row: number; message: string }[] = [];
      let processed = 0;
      
      // Group fieldMappings by table
      const tableFields: Record<string, Record<string, string>> = {};
      
      Object.entries(fieldMappings).forEach(([csvHeader, dbFieldWithTable]) => {
        if (!dbFieldWithTable) return; // Skip unmapped fields
        
        const [table, field] = dbFieldWithTable.split('.');
        if (!table || !field) return;
        
        if (!tableFields[table]) {
          tableFields[table] = {};
        }
        
        tableFields[table][csvHeader] = dbFieldWithTable;
      });
      
      // Process data row by row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        try {
          // Skip rows without email
          const email = row[emailHeader]?.trim();
          if (!email) {
            throw new Error('Email is required for client import');
          }
          
          // Process client data first
          let clientId: string | undefined;
          
          // Always try to create a client, even if no specific client fields are mapped
          // Email is the minimum requirement
          clientId = await processClientData(row, tableFields['clients'] || { [emailHeader]: 'clients.email' }, branchId);
            
          // Process dog data if client was created
          if (clientId) {
            try {
              // Only process dog data if there's a dog name
              const dogName = findDogName(row, fieldMappings);
              if (dogName) {
                // Add the dog name to table fields if it's not already mapped
                if (!tableFields['dogs']) {
                  tableFields['dogs'] = {};
                }
                
                let dogNameMapped = false;
                for (const [_, mapping] of Object.entries(tableFields['dogs'])) {
                  if (mapping === 'dogs.name') {
                    dogNameMapped = true;
                    break;
                  }
                }
                
                if (!dogNameMapped) {
                  // Find the column that looks like a dog name
                  for (const [header, value] of Object.entries(row)) {
                    if (header.toLowerCase().includes('dog') && value) {
                      tableFields['dogs'][header] = 'dogs.name';
                      break;
                    }
                  }
                }
                
                const dogId = await processDogData(row, tableFields['dogs'], clientId);
                
                // Process class enrollments if dog was created (but don't fail the import if this fails)
                if (dogId) {
                  try {
                    await processClassEnrollments(row, fieldMappings, dogId);
                  } catch (classError: any) {
                    console.warn(`Class enrollment processing failed for row ${i+1} but continuing import:`, classError);
                  }
                }
              } else {
                console.log(`No dog name found for row ${i+1}, skipping dog creation`);
              }
            } catch (dogError: any) {
              console.warn(`Dog processing failed for row ${i+1} but continuing import:`, dogError);
            }
            
            // Count as processed if at least the client was created
            processed++;
            setProcessingResults(prev => ({
              ...prev,
              processed: processed
            }));
          }
        } catch (error: any) {
          console.error(`Error processing row ${i+1}:`, error);
          errors.push({ 
            row: i+1, 
            message: error.message || 'Unknown error' 
          });
          
          setProcessingResults(prev => ({
            ...prev,
            errors: [...prev.errors, { row: i+1, message: error.message || 'Unknown error' }]
          }));
        }
      }
      
      return {
        success: processed > 0,
        errors: errors.map(e => `Row ${e.row}: ${e.message}`)
      };
    } catch (error: any) {
      console.error("General import error:", error);
      return {
        success: false,
        errors: [error.message || 'An unexpected error occurred']
      };
    } finally {
      setIsUploading(false);
    }
  };
  
  // Helper function to find a dog name in the row data
  const findDogName = (row: any, fieldMappings: FieldMapping): string | undefined => {
    // First check if we have a mapped dog name field
    const dogNameMapping = Object.entries(fieldMappings).find(
      ([_, value]) => value === 'dogs.name'
    );
    
    if (dogNameMapping && row[dogNameMapping[0]]) {
      return row[dogNameMapping[0]];
    }
    
    // Try to find a column that might contain dog names
    for (const [header, value] of Object.entries(row)) {
      if (
        (header.toLowerCase().includes('dog') || 
         header.toLowerCase().includes("dog's name")) && 
        value && 
        typeof value === 'string' && 
        value.trim() !== '-' && 
        value.trim() !== ''
      ) {
        return value;
      }
    }
    
    return undefined;
  };

  return {
    isUploading,
    processingResults,
    processImport
  };
}
