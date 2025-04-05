
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUnreadMessages(clientId?: string) {
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Fetch unread messages count
  useEffect(() => {
    if (!clientId) return;

    const fetchUnreadMessages = async () => {
      try {
        // Use direct RPC function to count unread messages
        // Need to use any to bypass TypeScript restriction since our custom RPC isn't in the types
        const { data, error } = await (supabase.rpc as any)('get_unread_message_count', 
          { p_client_id: clientId });
          
        if (error) {
          console.error("Error getting unread messages count:", error);
          
          // Fallback approach
          const { data: messages, error: msgError } = await supabase
            .from('client_messages')
            .select('id')
            .eq('client_id', clientId)
            .eq('is_from_client', false)
            .is('is_read', false);
            
          if (msgError) {
            console.error("Error in fallback unread count:", msgError);
            return;
          }
          
          setUnreadMessageCount(messages?.length || 0);
        } else {
          // Ensure we're setting a number, not a boolean
          setUnreadMessageCount(typeof data === 'number' ? data : 0);
        }
      } catch (error) {
        console.error("Error checking messages:", error);
      }
    };

    fetchUnreadMessages();
  }, [clientId]);

  // Subscribe to new messages in real-time
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel(`client-messages-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_messages',
          filter: `client_id=eq.${clientId} AND is_from_client=eq.false` // Only staff messages
        },
        (payload) => {
          // Increment unread count when a new message arrives
          setUnreadMessageCount(prev => prev + 1);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  return { unreadMessageCount };
}
