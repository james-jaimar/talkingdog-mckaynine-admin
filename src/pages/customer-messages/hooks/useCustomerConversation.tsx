
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { useToast } from "@/components/ui/use-toast";
import { useCustomerMessages } from "./useCustomerMessages";
import { supabase } from "@/integrations/supabase/client";

export function useCustomerConversation(clientId: string | null) {
  const [conversationReady, setConversationReady] = useState(false);
  const [actualClientId, setActualClientId] = useState<string | null>(clientId);
  const { user, isHandler } = useAuth();
  const { toast } = useToast();

  // If we don't have a client ID but we have a user ID and they're a handler,
  // look up their client ID from the clients table
  useEffect(() => {
    const lookupClientId = async () => {
      if (!clientId && user) {
        try {
          console.log("Looking up client ID for user:", user.id);
          
          // Look for a client with matching email to the user
          const { data: clientData, error } = await supabase
            .from('clients')
            .select('id')
            .eq('email', user.email)
            .single();
            
          if (error) {
            console.error("Error looking up client:", error);
            toast({
              title: "Error finding your client profile",
              description: "There was a problem connecting to your account.",
              variant: "destructive",
            });
            return;
          }
          
          if (clientData) {
            console.log("Found client ID:", clientData.id);
            setActualClientId(clientData.id);
          } else {
            console.log("No client found for email:", user.email);
            
            // Only create a client record if the user is a handler
            if (isHandler) {
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
                  return;
                }
                
                console.log("Created new client with ID:", newClient.id);
                setActualClientId(newClient.id);
                toast({
                  title: "Client profile created",
                  description: "A client profile has been created for your account.",
                });
              } catch (createError) {
                console.error("Error in client creation:", createError);
              }
            } else {
              toast({
                title: "Client profile not found",
                description: "Could not find a client profile for your account.",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error("Error in lookupClientId:", error);
        }
      }
    };
    
    lookupClientId();
  }, [clientId, user, isHandler, toast]);
  
  const {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    sendMessage
  } = useCustomerMessages(actualClientId);

  // Check if we have everything needed for conversation
  useEffect(() => {
    if (!user) {
      setConversationReady(false);
      toast({
        title: "Authentication required",
        description: "Please log in to view and send messages.",
        variant: "destructive",
      });
      return;
    }
    
    if (!actualClientId) {
      setConversationReady(false);
      toast({
        title: "Client data not found",
        description: "Unable to load conversation data for your account.",
        variant: "destructive",
      });
      return;
    }
    
    setConversationReady(true);
  }, [actualClientId, user, toast]);

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
