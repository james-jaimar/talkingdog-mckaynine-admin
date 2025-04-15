
import { supabase } from "@/integrations/supabase/client";
import { FormValues } from "../../form/handlerAddFormSchema";

export function useClientCreation() {
  const createClient = async (data: FormValues, branchId: string) => {
    try {
      console.log("Creating client with branch ID:", branchId);
      
      if (!branchId) {
        throw new Error("Branch ID is required to create a client");
      }
      
      const clientData = {
        first_name: data.name.split(' ')[0] || data.name,
        last_name: data.name.split(' ').slice(1).join(' ') || '',
        email: data.email,
        phone: data.phone || null,
        branch_id: branchId,
      };
      
      // Check if client with email already exists
      const { data: existingClients, error: checkError } = await supabase
        .from('clients')
        .select('id, email')
        .eq('email', data.email)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking for existing client:", checkError);
      }
      
      if (existingClients) {
        throw new Error(`Handler with email ${data.email} already exists in the system.`);
      }

      // Create new client
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) {
        console.error("Error creating client:", error);
        throw new Error(`Failed to create handler: ${error.message}`);
      }

      console.log("Client created successfully:", newClient);
      return newClient;
    } catch (error) {
      console.error("Error in createClient:", error);
      throw error;
    }
  };

  return { createClient };
}
