
import { useAuth } from "@/context/auth";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useCustomerConversation } from "./hooks/useCustomerConversation";
import { AccessDenied } from "./components/AccessDenied";
import { LoadingState } from "./components/LoadingState";
import { MessagingNotAvailable } from "./components/MessagingNotAvailable";
import { MessagesContent } from "./components/MessagesContent";

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
    return <AccessDenied />;
  }

  // Show loading state while we're initially loading
  if (initializing) {
    return <LoadingState />;
  }

  // Show error if messaging is not available for this user
  if (!initializing && !conversationReady) {
    return <MessagingNotAvailable />;
  }

  return (
    <>
      <Helmet>
        <title>Messages - McKaynine Training Centre</title>
      </Helmet>
      <MessagesContent 
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        isLoading={isLoading}
        isSending={isSending}
        sendMessage={sendMessage}
        clientId={clientId}
      />
    </>
  );
}
