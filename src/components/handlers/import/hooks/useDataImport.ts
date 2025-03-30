
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
    const errors: string[] = [];
    const successful: number[] = [];

    try {
      // Group mappings by table
      const tableGroups: Record<string, Record<string, string>> = {};
      
      Object.entries(fieldMappings).forEach(([csvHeader, dbFieldWithTable]) => {
        const [table, dbField] = dbFieldWithTable.split('.');
        if (!tableGroups[table]) {
          tableGroups[table] = {};
        }
        tableGroups[table][dbField] = csvHeader;
      });

      // First pass: preload existing clients to check for duplicates
      let existingClients = new Map<string, string>();
      if (tableGroups.clients && tableGroups.clients.email) {
        const emailHeader = tableGroups.clients.email;
        existingClients = await loadExistingClients(csvData, emailHeader);
      }
      
      // Process each row
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        try {
          // Prepare client data
          if (tableGroups.clients) {
            // Process client data
            const clientData = processClientData(row, tableGroups, branchId);
            
            // Make sure we have required fields
            if (!clientData.email) {
              throw new Error('Email is required for client import');
            }
            
            // Create or update client
            const clientId = await createOrUpdateClient(clientData, existingClients);
            
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
              
              // Make sure we have required fields
              if (!dogData.name) {
                throw new Error('Dog name is required');
              }
              if (!dogData.breed) {
                throw new Error('Dog breed is required');
              }
              
              // Create the dog and process related data
              await createDog(dogData, row, tableGroups);
            }
            
            successful.push(i);
          }
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }
      
      // Show success or error message
      if (successful.length > 0) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${successful.length} handlers${errors.length > 0 ? ` (${errors.length} errors)` : ''}.`,
          variant: errors.length > 0 ? "default" : "default"
        });
      } else {
        toast({
          title: "Import failed",
          description: "No data was imported. Please check the error messages.",
          variant: "destructive"
        });
      }
      
      return { success: successful.length > 0, errors };
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
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
