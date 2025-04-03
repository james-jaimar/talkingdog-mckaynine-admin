
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
          sender_name: msg.is_from_client ? 'You' : msg.profiles?.full_name || 'Staff'
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
    
    const handleNewMessage = async (newMsg: ClientMessage) => {
      console.log("Received new message:", newMsg);
      try {
        // Make a shallow copy with proper sender name
        const processedMsg = { ...newMsg };
        
        if (!newMsg.is_from_client) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newMsg.sender_id)
              .maybeSingle();
              
            processedMsg.sender_name = data?.full_name || 'Staff';
          } catch (err) {
            console.error("Error getting sender profile:", err);
            processedMsg.sender_name = 'Staff';
          }
        } else {
          processedMsg.sender_name = 'You';
        }
        
        // Add new message to state, avoiding duplicates
        setMessages(prev => {
          // Check if message already exists
          if (prev.some(msg => msg.id === processedMsg.id)) {
            return prev;
          }
          return [...prev, processedMsg];
        });
      } catch (error) {
        console.error("Error processing new message:", error);
      }
    };
    
    const channel = subscribeToClientMessages(clientId, handleNewMessage);
      
    return () => {
      console.log("Cleaning up message subscription");
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const sendMessage = async () => {
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
      
      // Verify authenticated state before attempting to send
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error("No active auth session found when trying to send message");
        toast({
          title: "Authentication error", 
          description: "You need to be logged in to send messages. Please refresh the page and try again.",
          variant: "destructive"
        });
        return;
      }
      
      const messageData = {
        client_id: clientId,
        sender_id: user.id,
        content: newMessage.trim(),
        is_from_client: true
      };

      console.log("Sending message with data:", messageData);
      const result = await sendClientMessage(messageData);
      
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
