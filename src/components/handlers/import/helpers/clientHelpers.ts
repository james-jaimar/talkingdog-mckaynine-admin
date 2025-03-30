
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { clientPreferences } from "../fieldDefinitions";

// Process client data from CSV row
export const processClientData = (
  row: any,
  tableGroups: Record<string, Record<string, string>>,
  branchId?: string | null
) => {
  // Initialize client data with the correct type structure
  const clientData: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    notes?: string;
    whatsapp?: boolean;
    photo_permission?: boolean;
    branch_id?: string | null;
    [key: string]: any;
  } = {
    first_name: '',
    last_name: '',
    email: '',
    branch_id: branchId || null
  };
  
  // Handle the name field - split into first/last name
  const nameHeader = tableGroups.clients.name;
  if (nameHeader && row[nameHeader]) {
    const nameParts = row[nameHeader].split(' ');
    
    if (nameParts.length > 1) {
      clientData.first_name = nameParts[0];
      clientData.last_name = nameParts.slice(1).join(' ');
    } else {
      clientData.first_name = nameParts[0];
      clientData.last_name = ''; // Default empty last name
    }
  }
  
  // Handle email field
  const clientEmail = tableGroups.clients.email && row[tableGroups.clients.email] 
    ? row[tableGroups.clients.email] 
    : '';
  
  if (clientEmail) {
    clientData.email = clientEmail;
  } else {
    throw new Error('Missing required email field');
  }
  
  // Handle phone field
  if (tableGroups.clients.phone && row[tableGroups.clients.phone]) {
    clientData.phone = row[tableGroups.clients.phone];
  }
  
  // Handle notes field
  if (tableGroups.clients.notes && row[tableGroups.clients.notes]) {
    clientData.notes = row[tableGroups.clients.notes];
  }
  
  // Handle preferences as dedicated fields, not notes
  for (const pref of clientPreferences) {
    if (tableGroups.clients[pref.column] && row[tableGroups.clients[pref.column]]) {
      const value = row[tableGroups.clients[pref.column]];
      // Convert to boolean based on value
      clientData[pref.column] = 
        value?.toLowerCase() === 'yes' || 
        value === '1' || 
        value?.toLowerCase() === 'true';
    }
  }
  
  // Validate required fields
  if (!clientData.first_name || !clientData.email) {
    throw new Error('Missing required client fields: name or email');
  }
  
  // Use a default last name if none provided
  if (!clientData.last_name) {
    clientData.last_name = '(no last name)';
  }
  
  return clientData;
};

// Handle client creation or update
export const createOrUpdateClient = async (
  clientData: any, 
  existingClients: Map<string, string>
) => {
  let clientId: string;
  
  // Check if client already exists by email
  if (existingClients.has(clientData.email)) {
    clientId = existingClients.get(clientData.email) || '';
    console.log(`Using existing client with ID: ${clientId} for email: ${clientData.email}`);
    
    // Update the existing client with any new information
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        phone: clientData.phone || null,
        notes: clientData.notes || null,
        whatsapp: clientData.whatsapp,
        photo_permission: clientData.photo_permission,
        branch_id: clientData.branch_id
      })
      .eq('id', clientId);
      
    if (updateError) {
      console.warn(`Warning: Could not update existing client: ${updateError.message}`);
    }
  } else {
    // Create a new client
    const { data: clientResult, error: clientError } = await supabase
      .from('clients')
      .insert(clientData)
      .select('id');
      
    if (clientError) throw clientError;
    
    if (!clientResult || clientResult.length === 0) {
      throw new Error('Failed to create client record');
    }
    
    clientId = clientResult[0].id;
  }
  
  return clientId;
};

// Load existing clients to avoid duplicates
export const loadExistingClients = async (csvData: any[], emailHeader: string) => {
  const existingClients = new Map<string, string>();
  
  // Create a list of unique emails from the CSV
  const uniqueEmails = new Set<string>();
  
  csvData.forEach(row => {
    if (emailHeader && row[emailHeader]) {
      uniqueEmails.add(row[emailHeader]);
    }
  });
  
  // Check which clients already exist in the database
  if (uniqueEmails.size > 0) {
    const { data: existingClientsData } = await supabase
      .from('clients')
      .select('id, email')
      .in('email', Array.from(uniqueEmails));
    
    if (existingClientsData) {
      existingClientsData.forEach(client => {
        existingClients.set(client.email, client.id);
        console.log(`Found existing client with email: ${client.email} with ID: ${client.id}`);
      });
    }
  }
  
  return existingClients;
};
