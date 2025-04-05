
import { ClientMessage } from "@/components/messages/types";
import { MessageAvatar } from "./message-parts/MessageAvatar";
import { MessageContent } from "./message-parts/MessageContent";
import { MessageMetadata } from "./message-parts/MessageMetadata";

interface MessageBubbleProps {
  message: ClientMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isFromClient = message.is_from_client;
  const senderName = message.sender_name || (isFromClient ? 'User' : 'Staff');

  return (
    <div className={`flex w-full ${isFromClient ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`flex ${isFromClient ? 'flex-row' : 'flex-row-reverse'} items-start gap-2 max-w-[80%]`}>
        {isFromClient && (
          <MessageAvatar 
            name={senderName} 
            isFromClient={isFromClient} 
          />
        )}
        <div>
          <MessageContent 
            message={message} 
            isFromClient={isFromClient} 
          />
          <MessageMetadata 
            senderName={senderName} 
            timestamp={message.created_at} 
          />
        </div>
        {!isFromClient && (
          <MessageAvatar 
            name={senderName} 
            isFromClient={isFromClient} 
          />
        )}
      </div>
    </div>
  );
}
