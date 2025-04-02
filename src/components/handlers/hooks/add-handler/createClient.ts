
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FormValues } from "../../form/handlerAddFormSchema";

export interface ClientData {
  id: string;
  [key: string]: any;
}

export const useClientCreation = () => {
  const { toast } = useToast();

  const createClient = async (
    data: FormValues, 
    branchId: string
  ): Promise<ClientData> => {
    console.log("Creating new client with branch ID:", branchId);
    
    try {
      // Check if client with this email already exists
      console.log("Checking if client exists with email:", data.email);
      const { data: existingClient, error: checkError } = await supabase
        .from("clients")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing client:", checkError);
        throw new Error(`Unable to verify if client exists: ${checkError.message}`);
      }

      if (existingClient) {
        console.log("Client already exists:", existingClient);
        throw new Error("A client with this email already exists");
      }

      // Insert client data with branch_id
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({
          first_name: data.name,
          last_name: "", // Empty last name field
          email: data.email,
          phone: data.phone || null,
          notes: data.comments || null,
          branch_id: branchId
        })
        .select("id")
        .single();

      if (clientError) {
        console.error("Client insertion error:", clientError);
        if (clientError.code === "23505") {
          throw new Error("This client email is already registered in the system");
        } else if (clientError.code === "23503") {
          throw new Error("Invalid branch selected. Please select a valid branch and try again.");
        } else {
          throw new Error(`Failed to create client: ${clientError.message}`);
        }
      }

      console.log("Client created successfully:", clientData);

      if (!clientData?.id) {
        throw new Error("Client was created but no ID was returned");
      }

      return clientData;
    } catch (error: any) {
      console.error("Client creation failed:", error);
      throw error; // Re-throw to be handled by the parent component
    }
  };

  return { createClient };
};
