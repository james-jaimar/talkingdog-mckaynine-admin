
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  getClientMessages, 
  sendClientMessage, 
  subscribeToClientMessages 
} from "@/components/messages/messageService";
import { ClientMessage } from "@/components/messages/types";

interface UseClientMessagesProps {
  clientId: string;
  clientName: string;
}

export function useClientMessages({ clientId, clientName }: UseClientMessagesProps) {
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch messages for this client
  useEffect(() => {
    if (!clientId) {
      console.log("No client ID provided, skipping message fetch");
      setIsLoading(false);
      return;
    }
    
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const messagesData = await getClientMessages(clientId);
        
        // Format messages with sender name
        const formattedMessages = messagesData.map((msg) => ({
          ...msg,
          sender_name: msg.is_from_client ? clientName : 'Staff'
        }));
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error loading messages",
          description: "There was a problem loading the conversation history.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [clientId, clientName, toast]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!clientId) {
      console.log("No client ID provided for subscription");
      return;
    }
    
    const handleNewMessage = (newMsg: ClientMessage) => {
      console.log("Received new message:", newMsg);
      
      // Process new message and add sender name
      const formattedMessage = {
        ...newMsg,
        sender_name: newMsg.is_from_client ? clientName : 'Staff'
      };
      
      // Add to state if not duplicate
      setMessages(prev => {
        if (prev.some(msg => msg.id === newMsg.id)) {
          return prev;
        }
        return [...prev, formattedMessage];
      });
    };
    
    const channel = subscribeToClientMessages(clientId, handleNewMessage);
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, clientName]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user || !clientId) {
      console.log("Cannot send message: missing required data");
      return;
    }
    
    setIsSending(true);
    try {
      await sendClientMessage({
        client_id: clientId,
        sender_id: user.id,
        content: newMessage.trim(),
        is_from_client: false
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
  }, [newMessage, clientId, user, toast]);

  return {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    sendMessage
  };
}
