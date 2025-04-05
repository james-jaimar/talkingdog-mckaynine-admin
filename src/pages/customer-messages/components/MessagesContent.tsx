
import { ConversationView } from "@/components/messages/components/ConversationView";
import { MessagesHeader } from "./MessagesHeader";
import { ClientMessage } from "@/components/messages/types";
import { useEffect, useState } from "react";

interface MessagesContentProps {
  messages: ClientMessage[];
  newMessage: string;
  setNewMessage: (value: string) => void;
  isLoading: boolean;
  isSending: boolean;
  sendMessage: () => void;
  clientId: string | null;
}

export function MessagesContent({ 
  messages, 
  newMessage, 
  setNewMessage, 
  isLoading, 
  isSending, 
  sendMessage,
  clientId
}: MessagesContentProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // Calculate unread count on initial load and when messages change
  useEffect(() => {
    if (!isLoading) {
      const unreadMessages = messages.filter(msg => !msg.is_from_client && !msg.is_read);
      setUnreadCount(unreadMessages.length);
    }
  }, [messages, isLoading]);

  return (
    <div className="container py-8">
      <MessagesHeader unreadCount={unreadCount} />
      <ConversationView 
        title="Messages from McKaynine Training Centre"
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        isLoading={isLoading}
        isSending={isSending}
        sendMessage={sendMessage}
        clientId={clientId || undefined}
        emptyStateMessage="You have no messages yet. Send a message to our team and we'll get back to you soon!"
      />
    </div>
  );
}
