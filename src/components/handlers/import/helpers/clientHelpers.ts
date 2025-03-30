
import { supabase } from "@/integrations/supabase/client";

/**
 * Process client data from CSV row
 */
export async function processClientData(
  row: any, 
  fieldMappings: Record<string, string>, 
  branchId?: string | null
): Promise<string | undefined> {
  // Build client data from mappings
  const clientData: Record<string, any> = { branch_id: branchId };
  
  Object.entries(fieldMappings).forEach(([field, csvHeader]) => {
    clientData[field] = row[csvHeader];
  });
  
  // Validate email is present and valid
  if (!clientData.email || clientData.email.trim() === '') {
    throw new Error('Email is required for client import');
  }
  
  // Check if client with this email already exists
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
    // Ensure required fields exist for new client
    if (!clientData.first_name && clientData.name) {
      clientData.first_name = clientData.name.split(' ')[0] || 'Unknown';
    }
    
    if (!clientData.last_name && clientData.name) {
      const nameParts = clientData.name.split(' ');
      clientData.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';
    }
    
    // Create new client
    const { data, error } = await supabase
      .from('clients')
      .insert({
        email: clientData.email,
        first_name: clientData.first_name || 'Unknown',
        last_name: clientData.last_name || 'Unknown',
        branch_id: clientData.branch_id,
        phone: clientData.phone,
        address: clientData.address,
        city: clientData.city,
        postal_code: clientData.postal_code,
        notes: clientData.notes
      })
      .select('id')
      .single();
      
    if (error) throw error;
    return data?.id;
  }
}
