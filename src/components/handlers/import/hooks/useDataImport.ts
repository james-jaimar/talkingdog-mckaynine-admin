
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FieldMapping } from "../types";
import { loadExistingClients, processClientData, createOrUpdateClient } from "../helpers/clientHelpers";
import { processDogData, createOrUpdateDog } from "../helpers/dogHelpers";
import { processClassEnrollments } from "../helpers/classHelpers";

export function useDataImport() {
  const [isUploading, setIsUploading] = useState(false);

  const processImport = async (
    csvData: any[],
    fieldMappings: FieldMapping,
    branchId?: string | null
  ) => {
    setIsUploading(true);
    const errors: string[] = [];
    const successful: number[] = [];
    const existingClients = new Map<string, string>(); // email -> id mapping

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
      if (tableGroups.clients && tableGroups.clients.email) {
        const emailHeader = tableGroups.clients.email;
        const clientMap = await loadExistingClients(csvData, emailHeader);
        // Merge into our existing map
        clientMap.forEach((id, email) => {
          existingClients.set(email, id);
        });
      }
      
      // Process each row
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        try {
          // First create or find client
          if (tableGroups.clients) {
            // Process client data
            const clientData = processClientData(row, tableGroups, branchId);
            const clientId = await createOrUpdateClient(clientData, existingClients);
            
            // Store the new client in our map if it's new
            if (!existingClients.has(clientData.email)) {
              existingClients.set(clientData.email, clientId);
            }
            
            // If we have a valid client ID and dog data, create or update the dog
            if (clientId && tableGroups.dogs) {
              // Process dog data
              const dogData = processDogData(row, tableGroups, clientId);
              const dogId = await createOrUpdateDog(dogData, clientId);
              
              // If we have class enrollment data and a valid dog ID, create enrollments
              if (dogId && tableGroups.class_enrollments) {
                await processClassEnrollments(row, tableGroups, dogId);
              }
            }
            
            successful.push(i);
          }
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }
      
      toast({
        title: "Import completed",
        description: `Successfully imported ${successful.length} entries with their dogs. ${errors.length > 0 ? `${errors.length} errors occurred.` : ''}`,
        variant: errors.length > 0 ? "destructive" : "default"
      });
      
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
