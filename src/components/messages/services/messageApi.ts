
import { supabase } from "@/integrations/supabase/client";
import { ClientMessage } from "../types";
import { ClientMessageWithReadStatus, EnhancedSupabaseClient } from "@/integrations/supabase/custom-types";

// Cast our supabase client to the enhanced type that includes our custom RPC functions
const enhancedSupabase = supabase as unknown as EnhancedSupabaseClient;

/**
 * Get messages for a specific client
 */
export const getClientMessages = async (clientId: string): Promise<ClientMessageWithReadStatus[]> => {
  const { data, error } = await supabase
    .from('client_messages')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at');

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return data as ClientMessageWithReadStatus[];
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
  if (!messageIds.length) return;
  
  try {
    // Use the enhanced client with proper typing for our custom RPC function
    // Use type assertion to bypass TypeScript limitations
    const { error } = await (supabase as any).rpc('mark_messages_as_read', {
      p_client_id: clientId,
      p_message_ids: messageIds
    });
    
    if (error) {
      console.error('Error marking messages as read (RPC):', error);
      
      // Fallback to direct query if RPC fails
      const { error: fallbackError } = await supabase
        .from('client_messages')
        .update({ is_read: true })
        .eq('client_id', clientId)
        .in('id', messageIds);
      
      if (fallbackError) {
        console.error('Error in fallback method:', fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Get unread message count for a client
 */
export const getUnreadMessageCount = async (clientId: string): Promise<number> => {
  try {
    // Use the enhanced client with proper typing for our custom RPC function
    // Use type assertion to bypass TypeScript limitations
    const { data, error } = await (supabase as any).rpc(
      'get_unread_message_count', { 
        p_client_id: clientId 
      });
    
    if (error) {
      console.error('Error getting unread count (RPC):', error);
      
      // Fallback using regular query if RPC fails
      const { data: messages, error: messagesError } = await supabase
        .from('client_messages')
        .select('id')
        .eq('client_id', clientId)
        .eq('is_from_client', false)
        .is('is_read', false);
      
      if (messagesError) throw messagesError;
      
      return messages?.length || 0;
    }
    
    // Ensure we return a number, not a boolean
    return typeof data === 'number' ? data : 0;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    throw error;
  }
};
