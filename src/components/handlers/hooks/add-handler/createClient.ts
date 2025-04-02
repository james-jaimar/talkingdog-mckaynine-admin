
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
    
    // Check if client with this email already exists
    console.log("Checking if client exists with email:", data.email);
    const { data: existingClient, error: checkError } = await supabase
      .from("clients")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing client:", checkError);
      throw new Error(`Error checking existing client: ${checkError.message}`);
    }

    if (existingClient) {
      console.log("Client already exists:", existingClient);
      toast({
        title: "Client already exists",
        description: "A client with this email already exists.",
        variant: "destructive",
      });
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
      throw new Error(`Failed to create client: ${clientError.message}`);
    }

    console.log("Client created successfully:", clientData);

    if (!clientData?.id) {
      throw new Error("Client was created but no ID was returned");
    }

    return clientData;
  };

  return { createClient };
};
