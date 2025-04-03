
import { supabase } from "@/integrations/supabase/client";
import { ClientMessage, ClientMessagesInsert } from "./types";

/**
 * Get all messages for a client
 */
export const getClientMessages = async (clientId: string) => {
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
    
  if (error) throw error;
  return data as ClientMessage[];
};

/**
 * Send a new message
 */
export const sendClientMessage = async (message: ClientMessagesInsert) => {
  // Using 'as any' to bypass TypeScript's type checking for now
  const { error } = await (supabase
    .from('client_messages' as any)
    .insert(message) as any);
    
  if (error) throw error;
  return true;
};

/**
 * Subscribe to real-time messages for a client
 */
export const subscribeToClientMessages = (
  clientId: string, 
  callback: (message: ClientMessage) => void
) => {
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
        // The payload.new contains the inserted row
        callback(payload.new as ClientMessage);
      }
    )
    .subscribe();
    
  // Return the channel so it can be unsubscribed
  return channel;
};
