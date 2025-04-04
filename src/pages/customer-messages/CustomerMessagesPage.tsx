
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ConversationView } from "@/components/messages/components/ConversationView";
import { useCustomerConversation } from "./hooks/useCustomerConversation";
import { Helmet } from "react-helmet";

export default function CustomerMessagesPage() {
  const { user, isHandler } = useAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  
  // Set client ID from user data when user is a handler
  useEffect(() => {
    if (user) {
      setClientId(user.id);
    }
  }, [user]);
  
  const {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    sendMessage,
    conversationReady
  } = useCustomerConversation(clientId);

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
