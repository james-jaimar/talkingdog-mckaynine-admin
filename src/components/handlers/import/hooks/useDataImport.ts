
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
          if (!row[emailHeader] || row[emailHeader].trim() === '') {
            throw new Error('Email is required for client import');
          }
          
          // Process client data first
          let clientId: string | undefined;
          if (tableFields['clients']) {
            clientId = await processClientData(row, tableFields['clients'], branchId);
            
            // Process dog data if client was created
            if (clientId && tableFields['dogs']) {
              try {
                const dogId = await processDogData(row, tableFields['dogs'], clientId);
                
                // Process class enrollments if dog was created (but don't fail the import if this fails)
                if (dogId && tableFields['class_enrollments']) {
                  try {
                    await processClassEnrollments(row, tableFields['class_enrollments'], dogId);
                  } catch (classError: any) {
                    console.warn(`Class enrollment processing failed for row ${i+1} but continuing import:`, classError);
                  }
                }
              } catch (dogError: any) {
                console.warn(`Dog processing failed for row ${i+1} but continuing import:`, dogError);
              }
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

  return {
    isUploading,
    processingResults,
    processImport
  };
}
