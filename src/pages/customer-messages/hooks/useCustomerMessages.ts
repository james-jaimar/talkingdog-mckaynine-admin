
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { useToast } from "@/components/ui/use-toast";
import { ClientMessage } from "@/components/messages/types";
import { 
  getClientMessages, 
  sendClientMessage, 
  subscribeToClientMessages 
} from "@/components/messages/messageService";

export function useCustomerMessages(clientId: string | null) {
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch messages for this client
  useEffect(() => {
    if (!clientId) return;
    
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const messagesData = await getClientMessages(clientId);
        
        // Format messages with sender name
        const formattedMessages = messagesData.map((msg) => ({
          ...msg,
          sender_name: msg.is_from_client ? 'You' : msg.profiles?.full_name || 'Staff'
        }));
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error loading messages",
          description: "There was a problem loading your conversation history.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [clientId, toast]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!clientId) return;
    
    const handleNewMessage = async (newMsg: ClientMessage) => {
      try {
        if (!newMsg.is_from_client) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMsg.sender_id)
            .single();
            
          newMsg.sender_name = data?.full_name || 'Staff';
        } else {
          newMsg.sender_name = 'You';
        }
        
        // Add new message to state
        setMessages(prev => [...prev, newMsg]);
      } catch (error) {
        console.error("Error processing new message:", error);
      }
    };
    
    const channel = subscribeToClientMessages(clientId, handleNewMessage);
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !clientId || !user) return;
    
    setIsSending(true);
    try {
      await sendClientMessage({
        client_id: clientId,
        sender_id: user.id,
        content: newMessage.trim(),
        is_from_client: true
      });
      
      // Clear input field
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    sendMessage
  };
}

// Import supabase here to avoid circular dependencies
import { supabase } from "@/integrations/supabase/client";
