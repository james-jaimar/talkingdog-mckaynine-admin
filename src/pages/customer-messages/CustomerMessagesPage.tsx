
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

export default function CustomerMessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  
  // Get client ID from user email
  useEffect(() => {
    if (!user) return;
    
    const getClientId = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id')
          .eq('email', user.email)
          .single();
          
        if (error) throw error;
        setClientId(data.id);
      } catch (error) {
        console.error("Error fetching client ID:", error);
      }
    };
    
    getClientId();
  }, [user]);

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
          <MessagesContainer 
            messages={messages}
            isLoading={isLoading} 
          />
          
          {clientId && (
            <MessageComposer
              value={newMessage}
              onChange={setNewMessage}
              onSend={sendMessage}
              isSending={isSending}
            />
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
