
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
  // Start with required structure for client data
  const clientData: {
    branch_id?: string | null;
    email?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    notes?: string;
  } = { 
    branch_id: branchId 
  };
  
  // Map fields from CSV to client data
  Object.entries(fieldMappings).forEach(([dbField, csvHeader]) => {
    if (dbField in clientData) {
      (clientData as any)[dbField] = row[csvHeader];
    }
  });
  
  // Check if email exists and is valid before proceeding
  if (!clientData.email || clientData.email.trim() === '') {
    throw new Error('Email is required for client import');
  }
  
  // Handle special case for name if first_name and last_name are present
  if (clientData.first_name && clientData.last_name && !clientData.name) {
    clientData.name = `${clientData.first_name} ${clientData.last_name}`;
  }
  
  // Check if client exists by email
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
    // Ensure required fields exist
    if (!clientData.first_name) {
      clientData.first_name = clientData.name?.split(' ')[0] || 'Unknown';
    }
    
    if (!clientData.last_name) {
      const nameParts = clientData.name?.split(' ') || [];
      clientData.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';
    }
    
    // Create new client with required fields
    const clientRecord = {
      branch_id: clientData.branch_id,
      email: clientData.email,
      first_name: clientData.first_name,
      last_name: clientData.last_name,
      phone: clientData.phone,
      address: clientData.address,
      city: clientData.city,
      postal_code: clientData.postal_code,
      notes: clientData.notes
    };
    
    // Type assertion to make TypeScript happy
    const recordWithRequiredFields = clientRecord as {
      email: string;
      first_name: string;
      last_name: string;
      branch_id?: string | null;
      phone?: string;
      address?: string;
      city?: string;
      postal_code?: string;
      notes?: string;
    };
    
    const { data, error } = await supabase
      .from('clients')
      .insert(recordWithRequiredFields)
      .select('id')
      .single();
      
    if (error) throw error;
    return data?.id;
  }
}
