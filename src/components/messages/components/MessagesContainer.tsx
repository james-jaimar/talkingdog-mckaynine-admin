
import { ClientMessage } from "@/components/messages/types";
import { MessageBubble } from "./MessageBubble";
import { LoadingMessages } from "./messaging-states/LoadingMessages";
import { EmptyMessages } from "./messaging-states/EmptyMessages";
import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on initial load and when new messages arrive
  useEffect(() => {
    if (!isLoading && messages.length && messagesEndRef.current) {
      // Use scrollIntoView with behavior: 'auto' for instant scrolling without animation
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages.length, isLoading]);

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 space-y-4 h-[400px]">
      {isLoading ? (
        <LoadingMessages />
      ) : messages.length === 0 ? (
        <EmptyMessages message={emptyStateMessage} />
      ) : (
        <div className="space-y-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </ScrollArea>
  );
}
