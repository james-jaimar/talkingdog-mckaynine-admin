
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  getClientMessages, 
  sendClientMessage
} from "@/components/messages/services/messageApi";
import { ClientMessage } from "@/components/messages/types";

export interface UseClientMessagesProps {
  clientId: string;
  clientName: string;
}

export function useClientMessages({ clientId, clientName }: UseClientMessagesProps) {
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Fetch messages for this client
  useEffect(() => {
    if (!clientId) {
      console.error("No client ID provided to useClientMessages");
      setIsLoading(false);
      return;
    }

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        console.log(`Fetching messages for client: ${clientName} (${clientId})`);
        const messagesData = await getClientMessages(clientId);
        
        // Format messages with sender name
        const formattedMessages: ClientMessage[] = messagesData.map((msg) => ({
          ...msg,
          sender_name: msg.is_from_client ? clientName : 'You'
        }));
        
        console.log(`Fetched ${formattedMessages.length} messages`);
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

  // Set up real-time subscription
  useEffect(() => {
    if (!clientId) return;
    
    console.log(`Setting up real-time subscription for client ${clientId}`);
    
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
          console.log("Real-time message received:", payload);
          
          // Add message to state if it's new
          setMessages(prev => {
            const newMsg = payload.new as ClientMessage;
            
            // Skip if we already have this message
            if (prev.some(msg => msg.id === newMsg.id)) return prev;
            
            const formattedMessage: ClientMessage = {
              ...newMsg,
              sender_name: newMsg.is_from_client ? clientName : 'You'
            };
            
            return [...prev, formattedMessage];
          });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, clientName]);

  // Send a message to the client
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !clientId) {
      console.log("Cannot send message: missing content or client ID");
      return;
    }
    
    setIsSending(true);
    
    try {
      console.log(`Sending message to client: ${clientName} (${clientId})`);
      
      // Get current user's session for sender_id
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const messageData = {
        client_id: clientId,
        content: newMessage.trim(),
        is_from_client: false, // Staff sending to client
        sender_id: session.session.user.id // Add the required sender_id
      };
      
      await sendClientMessage(messageData);
      setNewMessage(""); // Clear input on success
      
      toast({
        title: "Message sent",
        description: `Your message to ${clientName} has been sent.`,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }, [newMessage, clientId, clientName, toast]);

  return {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    sendMessage
  };
}
