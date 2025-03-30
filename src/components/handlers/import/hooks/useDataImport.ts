
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FieldMapping } from "../types";
import { loadExistingClients, processClientData, createOrUpdateClient } from "../helpers/clientHelpers";
import { processDogData, createDog } from "../helpers/dogHelpers";

// Define a more specific return type for processImport
interface ImportResult {
  success: boolean;
  errors: string[];
}

export function useDataImport() {
  const [isUploading, setIsUploading] = useState(false);

  const processImport = async (
    csvData: any[],
    fieldMappings: FieldMapping,
    branchId?: string | null
  ): Promise<ImportResult> => {
    setIsUploading(true);
    console.log("Processing import...");
    const errors: string[] = [];
    const successful: number[] = [];

    try {
      // Group mappings by table
      const tableGroups: Record<string, Record<string, string>> = {};
      
      Object.entries(fieldMappings).forEach(([csvHeader, dbFieldWithTable]) => {
        if (!dbFieldWithTable) return; // Skip empty mappings
        
        const [table, dbField] = dbFieldWithTable.split('.');
        if (!table || !dbField) return;
        
        if (!tableGroups[table]) {
          tableGroups[table] = {};
        }
        tableGroups[table][dbField] = csvHeader;
      });
      
      console.log("Table groups:", tableGroups);

      // First pass: preload existing clients to check for duplicates
      let existingClients = new Map<string, string>();
      if (tableGroups.clients && tableGroups.clients.email) {
        const emailHeader = tableGroups.clients.email;
        existingClients = await loadExistingClients(csvData, emailHeader);
        console.log("Loaded existing clients:", existingClients.size);
      }
      
      // Process each row
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        try {
          console.log(`Processing row ${i+1}/${csvData.length}`);
          
          // Prepare client data
          if (tableGroups.clients) {
            // Process client data
            const clientData = processClientData(row, tableGroups, branchId);
            console.log("Processed client data:", clientData);
            
            // Make sure we have required fields
            if (!clientData.email) {
              throw new Error('Email is required for client import');
            }
            
            // Create or update client
            const clientId = await createOrUpdateClient(clientData, existingClients);
            console.log("Client created/updated with ID:", clientId);
            
            if (!clientId) {
              throw new Error('Failed to create or update client');
            }
            
            // Update existing clients map with the new client
            if (clientData.email) {
              existingClients.set(clientData.email, clientId);
            }
            
            // If we have dog data and a valid client ID, create the dog
            if (clientId && tableGroups.dogs) {
              // Process dog data
              const dogData = processDogData(row, tableGroups, clientId);
              console.log("Processed dog data:", dogData);
              
              // Make sure we have required fields
              if (!dogData.name) {
                throw new Error('Dog name is required');
              }
              if (!dogData.breed) {
                throw new Error('Dog breed is required');
              }
              
              // Create the dog and process related data
              await createDog(dogData, row, tableGroups);
              console.log("Dog created successfully");
            }
            
            successful.push(i);
          }
        } catch (error: any) {
          console.error(`Error processing row ${i+1}:`, error);
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }
      
      console.log("Import completed:", successful.length, "successful,", errors.length, "errors");
      
      // Return the result - don't show toast here as it's handled in the modal
      return { 
        success: successful.length > 0, 
        errors 
      };
    } catch (error: any) {
      console.error("Fatal import error:", error);
      return { success: false, errors: [error.message] };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    processImport
  };
}
