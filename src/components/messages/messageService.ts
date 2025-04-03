
import { supabase } from "@/integrations/supabase/client";
import { ClientMessage, ClientMessagesInsert } from "./types";

/**
 * Get all messages for a client
 */
export const getClientMessages = async (clientId: string) => {
  try {
    // Using 'as any' to bypass TypeScript's type checking for now
    const { data, error } = await (supabase
      .from('client_messages' as any)
      .select(`
        id,
        client_id,
        sender_id,
        content,
        is_from_client,
        created_at,
        profiles:sender_id (full_name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: true }) as any);
      
    if (error) {
      console.error("Error fetching client messages:", error);
      throw error;
    }
    
    console.log("Fetched messages:", data);
    return data as ClientMessage[];
  } catch (error) {
    console.error("Error in getClientMessages:", error);
    throw error;
  }
};

/**
 * Send a new message
 */
export const sendClientMessage = async (message: ClientMessagesInsert) => {
  try {
    console.log("Sending message:", message);
    
    // Using 'as any' to bypass TypeScript's type checking for now
    const { error } = await (supabase
      .from('client_messages' as any)
      .insert(message) as any);
      
    if (error) {
      console.error("Error sending client message:", error);
      throw error;
    }
    
    console.log("Message sent successfully");
    return true;
  } catch (error) {
    console.error("Error in sendClientMessage:", error);
    throw error;
  }
};

/**
 * Subscribe to real-time messages for a client
 */
export const subscribeToClientMessages = (
  clientId: string, 
  callback: (message: ClientMessage) => void
) => {
  console.log("Setting up subscription for client:", clientId);
  
  const channel = supabase
    .channel('client-messages-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'client_messages',
        filter: `client_id=eq.${clientId}`
      },
      (payload) => {
        console.log("New message received:", payload);
        // The payload.new contains the inserted row
        callback(payload.new as ClientMessage);
      }
    )
    .subscribe();
    
  // Return the channel so it can be unsubscribed
  return channel;
};
