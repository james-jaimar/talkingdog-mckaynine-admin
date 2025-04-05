
import { ClientMessage } from "@/components/messages/types";
import { MessageAvatar } from "./message-parts/MessageAvatar";
import { MessageContent } from "./message-parts/MessageContent";
import { MessageMetadata } from "./message-parts/MessageMetadata";

interface MessageBubbleProps {
  message: ClientMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isFromClient = message.is_from_client;
  const senderName = message.sender_name || 'User';

  return (
    <div 
      className={`flex ${isFromClient ? 'justify-start' : 'justify-end'} w-full`}
    >
      <div className={`flex ${isFromClient ? 'flex-row' : 'flex-row-reverse'} max-w-[80%] gap-2`}>
        <MessageAvatar 
          name={senderName} 
          isFromClient={isFromClient} 
        />
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
      </div>
    </div>
  );
}
