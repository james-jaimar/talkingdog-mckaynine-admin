
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  getClientMessages, 
  sendClientMessage, 
  subscribeToClientMessages,
  uploadMessageAttachment
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentData, setAttachmentData] = useState<{ url: string; type: string } | null>(null);
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

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setIsUploading(true);
    
    try {
      const result = await uploadMessageAttachment(file);
      setAttachmentData(result);
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your file. Please try again.",
        variant: "destructive",
      });
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  // Clear selected file
  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setAttachmentData(null);
  }, []);

  const sendMessage = useCallback(async () => {
    if ((!newMessage.trim() && !attachmentData) || !user || !clientId) {
      console.log("Cannot send message: missing required data");
      return;
    }
    
    setIsSending(true);
    try {
      await sendClientMessage({
        client_id: clientId,
        sender_id: user.id,
        content: newMessage.trim() || (attachmentData ? "Sent an attachment" : ""),
        is_from_client: false,
        attachment_url: attachmentData?.url,
        attachment_type: attachmentData?.type
      });
      
      // Clear input field and attachment
      setNewMessage("");
      setSelectedFile(null);
      setAttachmentData(null);
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
  }, [newMessage, clientId, user, toast, attachmentData]);

  return {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    sendMessage,
    selectedFile,
    isUploading,
    handleFileSelect,
    clearSelectedFile
  };
}
