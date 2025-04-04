
import { supabase } from "@/integrations/supabase/client";
import { ClientMessage } from "../types";

/**
 * Get messages for a specific client
 */
export const getClientMessages = async (clientId: string): Promise<ClientMessage[]> => {
  const { data, error } = await supabase
    .from('client_messages')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at');

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return data as ClientMessage[];
};

/**
 * Send a message to a client
 */
export const sendClientMessage = async (messageData: {
  client_id: string;
  content: string;
  is_from_client: boolean;
  sender_id: string;
}): Promise<ClientMessage> => {
  const { data, error } = await supabase
    .from('client_messages')
    .insert(messageData)
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }

  return data as ClientMessage;
};

/**
 * Mark specified messages as read by the client
 */
export const markMessagesAsRead = async (clientId: string, messageIds: string[]): Promise<void> => {
  // Create entries for each message to mark as read
  const readEntries = messageIds.map(messageId => ({
    client_id: clientId,
    message_id: messageId,
    read_at: new Date().toISOString()
  }));
  
  // Use upsert to avoid duplicates - if entry exists, it will be updated with new read_at
  const { error } = await supabase
    .from('message_read_status')
    .upsert(readEntries, { 
      onConflict: 'client_id,message_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Get unread message count for a client
 */
export const getUnreadMessageCount = async (clientId: string): Promise<number> => {
  try {
    // Get all messages from staff
    const { data: messages, error } = await supabase
      .from('client_messages')
      .select('id')
      .eq('client_id', clientId)
      .eq('is_from_client', false);
    
    if (error) throw error;
    if (!messages || messages.length === 0) return 0;
    
    const messageIds = messages.map(msg => msg.id);
    
    // Get read status entries for these messages
    const { data: readMessages, error: readError } = await supabase
      .from('message_read_status')
      .select('message_id')
      .eq('client_id', clientId)
      .in('message_id', messageIds);
    
    if (readError) throw readError;
    
    // Calculate unread count
    const readMessageIds = new Set((readMessages || []).map(rm => rm.message_id));
    const unreadCount = messages.filter(msg => !readMessageIds.has(msg.id)).length;
    
    return unreadCount;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    throw error;
  }
};
