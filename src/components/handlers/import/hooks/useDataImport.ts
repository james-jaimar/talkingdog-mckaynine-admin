
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
    console.log("processImport called with:", { dataLength: data.length, mappingsCount: Object.keys(fieldMappings).length, branchId });
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
        
        tableFields[table][field] = csvHeader;
      });
      
      console.log("Grouped field mappings by table:", tableFields);
      
      // Make sure we have email field mapped for clients
      if (!tableFields['clients'] || !Object.values(tableFields['clients']).includes('email')) {
        return {
          success: false,
          errors: ['Email field is required for client import but was not mapped']
        };
      }
      
      // Process data in batches
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        console.log(`Processing row ${i+1}/${data.length}`);
        
        try {
          // Process client data first
          if (tableFields['clients'] && Object.keys(tableFields['clients']).length > 0) {
            console.log("Processing client data for row", i+1);
            const clientId = await processClientData(row, tableFields['clients'], branchId);
            
            // Process dog data
            if (tableFields['dogs'] && Object.keys(tableFields['dogs']).length > 0 && clientId) {
              console.log("Processing dog data for row", i+1);
              const dogId = await processDogData(row, tableFields['dogs'], clientId);
              
              // Process class enrollments
              if (tableFields['class_enrollments'] && Object.keys(tableFields['class_enrollments']).length > 0 && dogId) {
                console.log("Processing class enrollments for row", i+1);
                await processClassEnrollments(row, tableFields['class_enrollments'], dogId);
              }
            }
          }
          
          processed++;
          setProcessingResults(prev => ({
            ...prev,
            processed: processed
          }));
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
          
          // Show toast for important errors
          if (error.message.includes('Email is required')) {
            toast({
              title: `Error in Row ${i+1}`,
              description: error.message,
              variant: "destructive"
            });
          }
        }
      }
      
      console.log("Import process completed with", errors.length, "errors");
      
      return {
        success: processed > 0, // Consider success if at least one row was imported
        errors: errors.map(e => `Row ${e.row}: ${e.message}`)
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
    processingResults,
    processImport
  };
}
