
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  getClientMessages, 
  sendClientMessage
} from "@/components/messages/services/messageApi";
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
        const formattedMessages: ClientMessage[] = messagesData.map((msg) => ({
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
    
    console.log("Setting up real-time message subscription for client:", clientId);
    
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
          console.log("Received new message:", payload);
          
          // Add new message to state, avoiding duplicates
          setMessages(prev => {
            // Check if message already exists
            if (prev.some(msg => msg.id === payload.new.id)) {
              return prev;
            }
            
            // Cast the new payload to ClientMessage with required fields
            const newMsg = payload.new as ClientMessage;
            
            // Format the new message with sender name
            const formattedMessage: ClientMessage = {
              ...newMsg,
              sender_name: newMsg.is_from_client ? 'You' : 'Staff'
            };
            
            return [...prev, formattedMessage];
          });
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });
      
    return () => {
      console.log("Cleaning up message subscription");
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  // Send a new message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim()) {
      console.log("Cannot send empty message");
      return;
    }
    
    if (!clientId) {
      console.error("Cannot send message: No client ID available");
      toast({
        title: "Error sending message",
        description: "Missing client information. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      console.error("Cannot send message: User not authenticated");
      toast({
        title: "Authentication required",
        description: "Please log in to send messages.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSending(true);
    try {
      console.log("Preparing to send message for clientId:", clientId);
      
      // Create message object with required fields, including sender_id
      const messageData = {
        client_id: clientId,
        content: newMessage.trim(),
        is_from_client: true,  // Always true when sending from customer interface
        sender_id: user.id     // Add the user's ID as the sender_id
      };

      console.log("Sending message with data:", messageData);
      const result = await sendClientMessage(messageData);
      
      console.log("Message sent successfully:", result);
      
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
