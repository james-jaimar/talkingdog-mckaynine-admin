
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { ConversationView } from "@/components/messages/components/ConversationView";
import { useCustomerConversation } from "./hooks/useCustomerConversation";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";

export default function CustomerMessagesPage() {
  const { user, isHandler } = useAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoadingClientId, setIsLoadingClientId] = useState(false);
  
  // Get client ID for the current user if they're a handler
  useEffect(() => {
    const fetchClientId = async () => {
      if (!user || !user.email) return;
      
      setIsLoadingClientId(true);
      try {
        console.log("Checking for client with email:", user.email);
        const { data, error } = await supabase
          .from('clients')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching client:", error);
          return;
        }
        
        if (data) {
          console.log("Found client ID:", data.id);
          setClientId(data.id);
        } else {
          console.log("No client found for email:", user.email);
        }
      } catch (error) {
        console.error("Error in fetchClientId:", error);
      } finally {
        setIsLoadingClientId(false);
      }
    };

    fetchClientId();
  }, [user]);
  
  const {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    sendMessage,
    clientId: resolvedClientId
  } = useCustomerConversation(clientId);
  
  const effectiveClientId = resolvedClientId || clientId;

  // Show access denied if user is not logged in
  if (!user) {
    return (
      <DashboardLayout>
        <Helmet>
          <title>Messages - McKaynine Training Centre</title>
        </Helmet>
        <div className="container py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You need to be logged in to view your messages.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading state while we're fetching the client ID
  if (isLoadingClientId) {
    return (
      <DashboardLayout>
        <Helmet>
          <title>Messages - McKaynine Training Centre</title>
        </Helmet>
        <div className="container py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600 mb-4" />
            <p className="text-lg text-mckaynine-600">Loading your messages...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error if we can't find a client ID for the user
  if (isHandler && !effectiveClientId) {
    return (
      <DashboardLayout>
        <Helmet>
          <title>Messages - McKaynine Training Centre</title>
        </Helmet>
        <div className="container py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Client Profile Not Found</AlertTitle>
            <AlertDescription>
              We couldn't find a client profile linked to your account. Please contact support.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>Messages - McKaynine Training Centre</title>
      </Helmet>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        <div className="max-w-4xl mx-auto h-[600px]">
          <ConversationView
            title="Staff Communication"
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            isLoading={isLoading}
            isSending={isSending}
            sendMessage={sendMessage}
            emptyStateMessage="No messages yet. Send a message to contact our staff."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
