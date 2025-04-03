
import { supabase } from "@/integrations/supabase/client";
import { ClientMessage, ClientMessagesInsert } from "../types";

/**
 * Get all messages for a client
 */
export const getClientMessages = async (clientId: string) => {
  try {
    console.log("Fetching messages for client ID:", clientId);
    
    // Check if we have an active session first
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      console.error("No active session when trying to fetch messages");
      throw new Error("Authentication required");
    }
    
    // Simple query to get only the necessary data
    const { data, error } = await supabase
      .from('client_messages')
      .select('id, client_id, sender_id, content, is_from_client, created_at, attachment_url, attachment_type')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error("Error fetching client messages:", error);
      throw error;
    }
    
    console.log("Successfully fetched messages:", data?.length || 0);
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
    console.log("Sending message with data:", {
      client_id: message.client_id,
      is_from_client: message.is_from_client,
      content_length: message.content?.length || 0,
      has_attachment: !!message.attachment_url
    });
    
    // Get current auth session
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Check if user is authenticated
    if (!sessionData.session) {
      console.error("No active session found");
      throw new Error("You must be logged in to send messages");
    }
    
    // Use authenticated user's ID as sender
    const userId = sessionData.session.user.id;
    
    // Create message object with current user as sender
    const messageToSend = {
      ...message,
      sender_id: userId
    };
    
    // Insert message
    const { data, error } = await supabase
      .from('client_messages')
      .insert(messageToSend)
      .select();
      
    if (error) {
      console.error("Error sending client message:", error);
      throw error;
    }
    
    console.log("Message sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in sendClientMessage:", error);
    throw error;
  }
};
