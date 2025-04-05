
import { useState, useEffect, useCallback } from "react";
import { ClientMessage } from "../types";
import * as messageApi from "../services/messageApi";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { ClientMessageWithReadStatus } from "@/integrations/supabase/custom-types";

interface UseClientMessagesProps {
  clientId: string;
  clientName: string;
}

export function useClientMessages({ clientId, clientName }: UseClientMessagesProps) {
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Load messages on clientId change
  useEffect(() => {
    const loadMessages = async () => {
      if (!clientId) return;
      setIsLoading(true);
      try {
        const loadedMessages = await messageApi.getClientMessages(clientId);
        // Cast to ClientMessage[] since we know the structure matches
        setMessages(loadedMessages as unknown as ClientMessage[]);
      } catch (error) {
        console.error("Error loading messages:", error);
        toast({
          title: "Error loading messages",
          description: "Failed to load messages. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [clientId, toast]);

  // Realtime updates
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel(`client-messages-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_messages',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // New message
            const newMessage = payload.new as ClientMessage;
            setMessages((prevMessages) => [...prevMessages, newMessage]);
          } else if (payload.eventType === 'UPDATE') {
            // Updated message
            const updatedMessage = payload.new as ClientMessage;
            setMessages((prevMessages) =>
              prevMessages.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
            );
          } else if (payload.eventType === 'DELETE') {
            // Deleted message
            const deletedMessageId = payload.old?.id as string;
            setMessages((prevMessages) =>
              prevMessages.filter((msg) => msg.id !== deletedMessageId)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const sendMessage = useCallback(async () => {
    if (!clientId || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const user = await supabase.auth.getUser();
      const messageData = {
        client_id: clientId,
        content: newMessage,
        is_from_client: true,
        sender_id: user?.data?.user?.id || 'system', // Use actual user ID
      };
      const sentMessage = await messageApi.sendClientMessage(messageData);
      setMessages((prevMessages) => [...prevMessages, sentMessage]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }, [clientId, newMessage, toast]);

  // Make sure we update our local messages state to reflect the read status
  const markMessagesAsRead = useCallback(async () => {
    if (!clientId) return;
    
    try {
      // Get all unread messages from the staff
      const unreadMessageIds = messages
        .filter(m => !m.is_from_client && !m.is_read)
        .map(m => m.id);
        
      if (unreadMessageIds.length === 0) return;
      
      // Mark them as read in the database
      await messageApi.markMessagesAsRead(clientId, unreadMessageIds);
      
      // Update local state
      setMessages(prev => 
        prev.map(message => 
          unreadMessageIds.includes(message.id) 
            ? { ...message, is_read: true } 
            : message
        )
      );
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [clientId, messages]);

  // Mark messages as read when component mounts or clientId changes
  useEffect(() => {
    if (clientId) {
      markMessagesAsRead();
    }
  }, [clientId, markMessagesAsRead]);

  return {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    sendMessage,
    markMessagesAsRead
  };
}
