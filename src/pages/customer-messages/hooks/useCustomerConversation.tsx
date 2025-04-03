
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { useToast } from "@/components/ui/use-toast";
import { useCustomerMessages } from "./useCustomerMessages";

export function useCustomerConversation(clientId: string | null) {
  const [conversationReady, setConversationReady] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
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
  } = useCustomerMessages(clientId);

  // Check if we have everything needed for conversation
  useEffect(() => {
    if (!clientId) {
      setConversationReady(false);
      toast({
        title: "Conversation error",
        description: "Unable to load conversation data.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      setConversationReady(false);
      toast({
        title: "Authentication required",
        description: "Please log in to view and send messages.",
        variant: "destructive",
      });
      return;
    }
    
    setConversationReady(true);
  }, [clientId, user, toast]);

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
    clearSelectedFile,
    conversationReady
  };
}
