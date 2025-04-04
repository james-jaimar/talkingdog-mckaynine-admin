
import { useState, useEffect } from "react";
import { useClientMessages } from "@/components/messages/hooks/useClientMessages";
import { ConversationView } from "@/components/messages/components/ConversationView";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";

interface HandlerCommunicationsProps {
  clientId: string;
  clientName: string;
}

export function HandlerCommunications({ clientId, clientName }: HandlerCommunicationsProps) {
  const [isClientReady, setIsClientReady] = useState(false);
  const { toast } = useToast();
  
  // Verify the client exists or create it if needed
  useEffect(() => {
    const verifyClient = async () => {
      try {
        // Check if client exists
        const { data: clientData, error } = await supabase
          .from('clients')
          .select('id')
          .eq('id', clientId)
          .single();
          
        if (error) {
          console.error("Error verifying client:", error);
          toast({
            title: "Error connecting to client",
            description: "There was a problem finding the client record.",
            variant: "destructive",
          });
          setIsClientReady(false);
        } else {
          // Client exists
          console.log("Client verified:", clientData.id);
          setIsClientReady(true);
        }
      } catch (error) {
        console.error("Error in verifyClient:", error);
        setIsClientReady(false);
      }
    };
    
    if (clientId) {
      verifyClient();
    }
  }, [clientId, toast]);
  
  const {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    sendMessage
  } = useClientMessages({
    clientId: isClientReady ? clientId : "", 
    clientName: clientName
  });
  
  // If client isn't ready, show loading state (handled by ConversationView)
  const effectiveLoading = isLoading || !isClientReady;

  return (
    <ConversationView
      title={`Communications with ${clientName}`}
      messages={messages}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      isLoading={effectiveLoading}
      isSending={isSending}
      sendMessage={sendMessage}
      emptyStateMessage="No messages yet. Send a message to start the conversation with this client."
    />
  );
}
