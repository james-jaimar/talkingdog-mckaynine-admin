
import { ClientMessage } from "@/components/messages/types";
import { MessageBubble } from "./MessageBubble";

interface MessagesContainerProps {
  messages: ClientMessage[];
  isLoading: boolean;
}

export function MessagesContainer({ messages, isLoading }: MessagesContainerProps) {
  return (
    <div className="flex-1 overflow-y-auto max-h-[500px] p-4 space-y-4">
      {isLoading ? (
        <div className="py-10 text-center text-gray-500">Loading messages...</div>
      ) : messages.length === 0 ? (
        <div className="py-10 text-center text-gray-500">
          No messages yet. Send a message to start the conversation.
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))
      )}
    </div>
  );
}
