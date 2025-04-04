
import { useAuth } from "@/context/auth";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { ConversationView } from "@/components/messages/components/ConversationView";
import { useCustomerConversation } from "./hooks/useCustomerConversation";
import { Helmet } from "react-helmet";
import { toast } from "sonner";

export default function CustomerMessagesPage() {
  const { user } = useAuth();
  const [initializing, setInitializing] = useState(true);
  
  const {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    sendMessage,
    conversationReady,
    clientId
  } = useCustomerConversation(null); // We don't provide a client ID, let the hook find it

  // Set initializing to false after initial load
  useEffect(() => {
    if (!isLoading) {
      setInitializing(false);
    }
  }, [isLoading]);

  // Show access denied if user is not logged in
  if (!user) {
    return (
      <>
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
      </>
    );
  }

  // Show loading state while we're initially loading
  if (initializing) {
    return (
      <>
        <Helmet>
          <title>Messages - McKaynine Training Centre</title>
        </Helmet>
        <div className="container py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-mckaynine-600 mb-4" />
            <p className="text-lg text-mckaynine-600">Loading your messages...</p>
          </div>
        </div>
      </>
    );
  }

  // Show error if messaging is not available for this user
  if (!initializing && !conversationReady) {
    return (
      <>
        <Helmet>
          <title>Messages - McKaynine Training Centre</title>
        </Helmet>
        <div className="container py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Messaging Not Available</AlertTitle>
            <AlertDescription>
              We couldn't set up messaging for your account. Please contact support.
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
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
            clientId={clientId} // Pass client ID to mark messages as read
          />
        </div>
      </div>
    </>
  );
}
