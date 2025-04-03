
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

export function useCustomerMessages(clientId: string | null) {
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch messages for this client
  useEffect(() => {
    if (!clientId) {
      console.log("No client ID provided for fetching messages");
      setIsLoading(false);
      return;
    }
    
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching messages for client:", clientId);
        const messagesData = await getClientMessages(clientId);
        
        // Format messages with sender name 
        const formattedMessages = messagesData.map((msg) => ({
          ...msg,
          sender_name: msg.is_from_client ? 'You' : 'Staff'
        }));
        
        console.log(`Formatted ${formattedMessages.length} messages`);
        setMessages(formattedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error loading messages",
          description: "Please refresh the page or try again later.",
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
    if (!clientId) {
      console.log("No client ID provided for message subscription");
      return;
    }
    
    console.log("Setting up real-time message subscription");
    
    const handleNewMessage = (newMsg: ClientMessage) => {
      console.log("Received new message:", newMsg);
      
      // Add new message to state, avoiding duplicates
      setMessages(prev => {
        // Check if message already exists
        if (prev.some(msg => msg.id === newMsg.id)) {
          return prev;
        }
        
        // Format the new message with sender name
        const formattedMessage = {
          ...newMsg,
          sender_name: newMsg.is_from_client ? 'You' : 'Staff'
        };
        
        return [...prev, formattedMessage];
      });
    };
    
    const channel = subscribeToClientMessages(clientId, handleNewMessage);
      
    return () => {
      console.log("Cleaning up message subscription");
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !clientId || !user) {
      console.log("Cannot send message: missing data", { 
        hasMessage: !!newMessage.trim(), 
        hasClientId: !!clientId, 
        hasUser: !!user
      });
      return;
    }
    
    setIsSending(true);
    try {
      console.log("Preparing to send message as client");
      
      const messageData = {
        client_id: clientId,
        sender_id: user.id,
        content: newMessage.trim(),
        is_from_client: true
      };

      console.log("Sending message with data:", messageData);
      await sendClientMessage(messageData);
      
      // Clear input field
      setNewMessage("");
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: "Please try again or refresh the page.",
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
