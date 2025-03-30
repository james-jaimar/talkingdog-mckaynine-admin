
import { supabase } from "@/integrations/supabase/client";

/**
 * Process client data from CSV row
 */
export async function processClientData(
  row: any, 
  fieldMappings: Record<string, string>, 
  branchId?: string | null
): Promise<string | undefined> {
  console.log("Processing client with mappings:", fieldMappings);
  
  // Build client data from mappings
  const clientData: Record<string, any> = { branch_id: branchId };
  
  // Process client fields
  Object.entries(fieldMappings).forEach(([csvHeader, dbFieldPath]) => {
    if (dbFieldPath.startsWith('clients.')) {
      const field = dbFieldPath.replace('clients.', '');
      clientData[field] = row[csvHeader];
    }
  });
  
  // Store WhatsApp and Photo Permission preferences in notes if they exist
  const whatsAppHeader = Object.entries(fieldMappings).find(([_, value]) => value === 'clients.whatsapp')?.[0];
  const photoPermissionHeader = Object.entries(fieldMappings).find(([_, value]) => value === 'clients.photo_permission')?.[0];
  
  // Add to notes field
  const preferences = [];
  if (whatsAppHeader && row[whatsAppHeader] && (row[whatsAppHeader].toLowerCase() === 'yes' || row[whatsAppHeader] === true || row[whatsAppHeader] === '1')) {
    preferences.push("WhatsApp: yes");
  }
  
  if (photoPermissionHeader && row[photoPermissionHeader] && (row[photoPermissionHeader].toLowerCase() === 'yes' || row[photoPermissionHeader] === true || row[photoPermissionHeader] === '1')) {
    preferences.push("Photo Permission: yes");
  }
  
  // Append preferences to existing notes
  if (preferences.length > 0) {
    if (clientData.notes) {
      clientData.notes = `${clientData.notes}\n${preferences.join("\n")}`;
    } else {
      clientData.notes = preferences.join("\n");
    }
  }
  
  // Validate email is present and valid
  if (!clientData.email || clientData.email.trim() === '') {
    throw new Error('Email is required for client import');
  }
  
  console.log("Client data to be inserted/updated:", clientData);
  
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
