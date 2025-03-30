
import { supabase } from "@/integrations/supabase/client";

/**
 * Load existing clients from Supabase based on email
 */
export async function loadExistingClients(csvData: any[], emailHeader: string): Promise<Map<string, string>> {
  const clientMap = new Map<string, string>();
  
  // Extract unique email addresses from CSV
  const emails = [...new Set(csvData.map(row => row[emailHeader]).filter(Boolean))];
  
  if (emails.length === 0) return clientMap;
  
  // Look up emails in the database
  const { data } = await supabase
    .from('clients')
    .select('id, email')
    .in('email', emails);
    
  if (data) {
    data.forEach(client => {
      if (client.email) {
        clientMap.set(client.email, client.id);
      }
    });
  }
  
  return clientMap;
}

/**
 * Process client data from CSV row
 */
export function processClientData(row: any, tableGroups: Record<string, Record<string, string>>, branchId?: string | null): Record<string, any> {
  const clientData: Record<string, any> = { branch_id: branchId };
  
  // Map fields from CSV to client data
  if (tableGroups.clients) {
    Object.entries(tableGroups.clients).forEach(([dbField, csvHeader]) => {
      clientData[dbField] = row[csvHeader];
    });
  }
  
  // Handle special case for name if first_name and last_name are present
  if (clientData.first_name && clientData.last_name && !clientData.name) {
    clientData.name = `${clientData.first_name} ${clientData.last_name}`;
  }
  
  return clientData;
}

/**
 * Create or update a client in Supabase
 */
export async function createOrUpdateClient(
  clientData: Record<string, any>,
  existingClients: Map<string, string>
): Promise<string | undefined> {
  try {
    // Check if client already exists by email
    const clientId = existingClients.get(clientData.email);
    
    if (clientId) {
      // Update existing client
      const { error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', clientId);
        
      if (error) throw error;
      return clientId;
    } else {
      // Create new client
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select('id')
        .single();
        
      if (error) throw error;
      return data?.id;
    }
  } catch (error) {
    console.error('Error creating/updating client:', error);
    throw error;
  }
}
