
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
  if (whatsAppHeader && row[whatsAppHeader] && (
      row[whatsAppHeader].toString().toLowerCase() === 'yes' || 
      row[whatsAppHeader] === true || 
      row[whatsAppHeader] === '1' ||
      row[whatsAppHeader].toString().toLowerCase().includes('yes')
  )) {
    preferences.push("WhatsApp: yes");
  }
  
  if (photoPermissionHeader && row[photoPermissionHeader] && (
      row[photoPermissionHeader].toString().toLowerCase() === 'yes' || 
      row[photoPermissionHeader] === true || 
      row[photoPermissionHeader] === '1' ||
      row[photoPermissionHeader].toString().toLowerCase().includes('yes')
  )) {
    preferences.push("Photo Permission: yes");
  }
  
  // Also check for direct WhatsApp and Photo Permission columns in the CSV
  Object.entries(row).forEach(([header, value]) => {
    if (header === 'WhatsApp' && value && value.toString().toLowerCase().includes('yes')) {
      if (!preferences.some(p => p.includes('WhatsApp'))) {
        preferences.push("WhatsApp: yes");
      }
    }
    
    if (header === 'Photo Permission' && value && value.toString().toLowerCase().includes('yes')) {
      if (!preferences.some(p => p.includes('Photo Permission'))) {
        preferences.push("Photo Permission: yes");
      }
    }
  });
  
  // Append preferences to existing notes
  if (preferences.length > 0) {
    if (clientData.notes) {
      clientData.notes = `${clientData.notes}\n${preferences.join("\n")}`;
    } else {
      clientData.notes = preferences.join("\n");
    }
  }
  
  // Also append any COMMENTS field directly if not already mapped
  const commentsHeader = Object.keys(row).find(header => 
    header.toLowerCase() === 'comments' && 
    !Object.entries(fieldMappings).some(([key, value]) => key === header && value.includes('notes'))
  );
  
  if (commentsHeader && row[commentsHeader]) {
    if (clientData.notes) {
      clientData.notes = `${clientData.notes}\n${row[commentsHeader]}`;
    } else {
      clientData.notes = row[commentsHeader];
    }
  }
  
  // Validate email is present and valid
  if (!clientData.email || clientData.email.trim() === '') {
    throw new Error('Email is required for client import');
  }
  
  // Extract first and last name from name if they're not explicitly mapped
  if (!clientData.first_name && !clientData.last_name && clientData.name) {
    const nameParts = clientData.name.split(' ');
    clientData.first_name = nameParts[0] || 'Unknown';
    clientData.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';
  }
  
  // If we don't have first_name or last_name, also look for a Name column that wasn't mapped
  if ((!clientData.first_name || !clientData.last_name) && !clientData.name) {
    const nameHeader = Object.keys(row).find(header => 
      header.toLowerCase() === 'name' && 
      !Object.entries(fieldMappings).some(([key, value]) => key === header)
    );
    
    if (nameHeader && row[nameHeader]) {
      const nameParts = row[nameHeader].split(' ');
      clientData.first_name = nameParts[0] || 'Unknown';
      clientData.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';
    }
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
    if (!clientData.first_name) {
      clientData.first_name = 'Unknown';
    }
    
    if (!clientData.last_name) {
      clientData.last_name = 'Unknown';
    }
    
    // Create new client
    const { data, error } = await supabase
      .from('clients')
      .insert({
        email: clientData.email,
        first_name: clientData.first_name,
        last_name: clientData.last_name,
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
