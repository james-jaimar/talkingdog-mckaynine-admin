
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FieldMapping } from "../types";
import { loadExistingClients } from "../helpers/clientHelpers";

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
        const clientEmails = csvData.map(row => row[emailHeader]).filter(Boolean);
        
        if (clientEmails.length > 0) {
          const { data: existingClientsData } = await supabase
            .from('clients')
            .select('id, email')
            .in('email', clientEmails);
            
          if (existingClientsData) {
            existingClientsData.forEach(client => {
              if (client.email) {
                existingClients.set(client.email, client.id);
              }
            });
          }
        }
      }
      
      // Process each row
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        try {
          // Prepare client data
          if (tableGroups.clients) {
            const clientData: Record<string, any> = { branch_id: branchId };
            
            // Map fields from CSV to client data
            Object.entries(tableGroups.clients).forEach(([dbField, csvHeader]) => {
              clientData[dbField] = row[csvHeader];
            });
            
            // Make sure we have required fields
            if (!clientData.email) {
              throw new Error('Email is required for client import');
            }
            
            // Generate name field if first_name and last_name are available
            if (clientData.first_name && clientData.last_name && !clientData.name) {
              clientData.name = `${clientData.first_name} ${clientData.last_name}`;
            }
            
            let clientId = existingClients.get(clientData.email);
            
            // Create or update client
            if (clientId) {
              // Update existing client
              const { error: updateError } = await supabase
                .from('clients')
                .update(clientData)
                .eq('id', clientId);
                
              if (updateError) throw updateError;
            } else {
              // Create new client
              const { data: newClient, error: insertError } = await supabase
                .from('clients')
                .insert(clientData)
                .select('id')
                .single();
                
              if (insertError) throw insertError;
              if (newClient) {
                clientId = newClient.id;
                existingClients.set(clientData.email, clientId);
              }
            }
            
            // If we have a dog data and a valid client ID, create or update the dog
            if (clientId && tableGroups.dogs) {
              const dogData: Record<string, any> = { client_id: clientId };
              
              // Map fields from CSV to dog data
              Object.entries(tableGroups.dogs).forEach(([dbField, csvHeader]) => {
                dogData[dbField] = row[csvHeader];
              });
              
              // Make sure we have required fields
              if (!dogData.name) {
                throw new Error('Dog name is required');
              }
              if (!dogData.breed) {
                throw new Error('Dog breed is required');
              }
              
              // Create the dog
              const { data: newDog, error: dogError } = await supabase
                .from('dogs')
                .insert(dogData)
                .select('id')
                .single();
                
              if (dogError) throw dogError;
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
