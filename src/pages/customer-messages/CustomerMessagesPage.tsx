
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { DashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { MessagesContainer } from "@/components/messages/components/MessagesContainer";
import { MessageComposer } from "@/components/messages/components/MessageComposer";
import { useCustomerMessages } from "./hooks/useCustomerMessages";
import { Loader2 } from "lucide-react";

export default function CustomerMessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(true);
  
  // Get client ID from user email
  useEffect(() => {
    if (!user) {
      console.log("No user is logged in");
      setIsLoadingClient(false);
      return;
    }
    
    const getClientId = async () => {
      setIsLoadingClient(true);
      try {
        console.log("Fetching client ID for email:", user.email);
        
        const { data, error } = await supabase
          .from('clients')
          .select('id, email')
          .eq('email', user.email)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching client ID:", error);
          throw error;
        }
        
        if (data) {
          console.log("Found client:", data);
          setClientId(data.id);
        } else {
          console.log("No client found for email:", user.email);
          toast({
            title: "Account not linked",
            description: "Your user account is not linked to a client profile. Please contact support.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching client ID:", error);
        toast({
          title: "Error loading profile",
          description: "There was a problem loading your profile information.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingClient(false);
      }
    };
    
    getClientId();
  }, [user, toast]);

  const {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    sendMessage
  } = useCustomerMessages(clientId);

  return (
    <DashboardLayout>
      <Helmet>
        <title>Messages - McKaynine Training Centre</title>
      </Helmet>
      
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        
        <Card className="min-h-[500px] flex flex-col">
          {isLoadingClient ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600 mb-4" />
              <p className="text-gray-500">Loading your profile...</p>
            </div>
          ) : !clientId ? (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="text-gray-500">No client profile found for your account.</p>
              <p className="text-gray-500">Please contact support for assistance.</p>
            </div>
          ) : (
            <>
              <MessagesContainer 
                messages={messages}
                isLoading={isLoading} 
              />
              
              <MessageComposer
                value={newMessage}
                onChange={setNewMessage}
                onSend={sendMessage}
                isSending={isSending}
              />
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
