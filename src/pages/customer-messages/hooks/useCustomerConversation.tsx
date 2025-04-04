
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth";
import { useToast } from "@/components/ui/use-toast";
import { useCustomerMessages } from "./useCustomerMessages";
import { supabase } from "@/integrations/supabase/client";

export function useCustomerConversation(initialClientId: string | null) {
  const [conversationReady, setConversationReady] = useState(false);
  const [actualClientId, setActualClientId] = useState<string | null>(initialClientId);
  const { user, isHandler } = useAuth();
  const { toast } = useToast();

  // Fetch or create client ID based on user information
  useEffect(() => {
    const lookupClientId = async () => {
      if (!user) {
        console.log("No authenticated user");
        setConversationReady(false);
        return;
      }

      try {
        console.log("Looking up client ID for user email:", user.email);
        
        // Look for a client with matching email to the user
        const { data: clientData, error } = await supabase
          .from('clients')
          .select('id')
          .eq('email', user.email)
          .single();
          
        if (error) {
          if (error.code !== 'PGRST116') { // Not found - this is expected sometimes
            console.error("Error looking up client:", error);
            toast({
              title: "Error finding your client profile",
              description: "There was a problem connecting to your account.",
              variant: "destructive",
            });
          }
        } else if (clientData) {
          console.log("Found client ID:", clientData.id);
          setActualClientId(clientData.id);
          setConversationReady(true);
          return; // Exit early if we found a client
        }
        
        // If we didn't return early, we need to create a client
        console.log("No client found for email:", user.email);
        
        // Create a client record regardless of user role to simplify the messaging flow
        try {
          const { data: newClient, error: createError } = await supabase
            .from('clients')
            .insert({
              email: user.email,
              first_name: user.user_metadata?.full_name?.split(' ')[0] || 'New',
              last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'User'
            })
            .select('id')
            .single();
            
          if (createError) {
            console.error("Error creating client:", createError);
            toast({
              title: "Error creating client profile",
              description: "Could not create a client profile for your account.",
              variant: "destructive",
            });
            setConversationReady(false);
            return;
          }
          
          console.log("Created new client with ID:", newClient.id);
          setActualClientId(newClient.id);
          setConversationReady(true);
          toast({
            title: "Client profile created",
            description: "A client profile has been created for your account.",
          });
        } catch (createError) {
          console.error("Error in client creation:", createError);
          setConversationReady(false);
        }
      } catch (error) {
        console.error("Error in lookupClientId:", error);
        setConversationReady(false);
      }
    };
    
    lookupClientId();
  }, [user, toast]);
  
  // Use customer messages hook with the client ID we found or created
  const {
    messages,
    newMessage,
    setNewMessage,
    isLoading: messagesLoading,
    isSending,
    sendMessage: sendMessageImpl
  } = useCustomerMessages(actualClientId);

  // Wrap send message to ensure client ID is available
  const sendMessage = useCallback(async () => {
    if (!actualClientId) {
      console.error("Cannot send message: No client ID available");
      toast({
        title: "Cannot send message",
        description: "Your client profile is not properly connected.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendMessageImpl();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: "There was a problem sending your message.",
        variant: "destructive",
      });
    }
  }, [actualClientId, sendMessageImpl, toast]);

  // Determine overall loading state
  const isLoading = !actualClientId || messagesLoading;

  return {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    sendMessage,
    conversationReady,
    clientId: actualClientId
  };
}
