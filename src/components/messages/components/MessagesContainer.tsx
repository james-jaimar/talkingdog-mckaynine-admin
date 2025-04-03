
import { ClientMessage } from "@/components/messages/types";
import { MessageBubble } from "./MessageBubble";
import { LoadingMessages } from "./messaging-states/LoadingMessages";
import { EmptyMessages } from "./messaging-states/EmptyMessages";
import { useEffect, useRef } from "react";

interface MessagesContainerProps {
  messages: ClientMessage[];
  isLoading: boolean;
  emptyStateMessage?: string;
}

export function MessagesContainer({ 
  messages, 
  isLoading,
  emptyStateMessage
}: MessagesContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto max-h-[500px] p-4 space-y-4">
      {isLoading ? (
        <LoadingMessages />
      ) : messages.length === 0 ? (
        <EmptyMessages message={emptyStateMessage} />
      ) : (
        <>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
