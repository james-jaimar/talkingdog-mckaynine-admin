
import { supabase } from "@/integrations/supabase/client";
import { ClientMessage } from "../types";

/**
 * Subscribe to real-time messages for a client
 */
export const subscribeToClientMessages = (
  clientId: string, 
  callback: (message: ClientMessage) => void
) => {
  console.log("Setting up subscription for client:", clientId);
  
  const channel = supabase
    .channel(`client-messages-${clientId}`)
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
        callback(payload.new as ClientMessage);
      }
    )
    .subscribe((status) => {
      console.log("Subscription status:", status);
    });
    
  // Return the channel so it can be unsubscribed
  return channel;
};
