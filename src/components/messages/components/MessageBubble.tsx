
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
    <div className="flex w-full mb-4">
      {/* Container with conditional justification */}
      <div className={`flex w-full ${isFromClient ? 'justify-start' : 'justify-end'}`}>
        <div className="flex items-start gap-2 max-w-[80%]">
          {/* Avatar for client messages */}
          {isFromClient && (
            <MessageAvatar 
              name={senderName} 
              isFromClient={isFromClient} 
            />
          )}
          
          {/* Message content and metadata */}
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
          
          {/* Avatar for staff messages */}
          {!isFromClient && (
            <MessageAvatar 
              name={senderName} 
              isFromClient={isFromClient} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
