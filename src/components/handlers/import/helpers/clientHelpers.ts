
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
export async function processClientData(
  row: any, 
  fieldMappings: Record<string, string>, 
  branchId?: string | null
): Promise<string | undefined> {
  const clientData: Record<string, any> = { branch_id: branchId };
  
  // Map fields from CSV to client data
  Object.entries(fieldMappings).forEach(([dbField, csvHeader]) => {
    clientData[dbField] = row[csvHeader];
  });
  
  // Handle special case for name if first_name and last_name are present
  if (clientData.first_name && clientData.last_name && !clientData.name) {
    clientData.name = `${clientData.first_name} ${clientData.last_name}`;
  }
  
  // Check if client exists by email
  if (clientData.email) {
    const { data: existingClients } = await supabase
      .from('clients')
      .select('id')
      .eq('email', clientData.email);
      
    if (existingClients && existingClients.length > 0) {
      // Update existing client
      const clientId = existingClients[0].id;
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
  } else {
    throw new Error('Email is required for client import');
  }
}
