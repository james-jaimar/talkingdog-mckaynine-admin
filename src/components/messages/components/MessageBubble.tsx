
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
      {isFromClient ? (
        // Client message - left aligned
        <div className="flex items-start gap-2 max-w-[80%]">
          <MessageAvatar 
            name={senderName} 
            isFromClient={true} 
          />
          <div>
            <MessageContent 
              message={message} 
              isFromClient={true} 
            />
            <MessageMetadata 
              senderName={senderName} 
              timestamp={message.created_at} 
            />
          </div>
        </div>
      ) : (
        // Staff message - right aligned
        <div className="flex items-start gap-2 max-w-[80%] ml-auto">
          <div>
            <MessageContent 
              message={message} 
              isFromClient={false} 
            />
            <MessageMetadata 
              senderName={senderName} 
              timestamp={message.created_at} 
            />
          </div>
          <MessageAvatar 
            name={senderName} 
            isFromClient={false} 
          />
        </div>
      )}
    </div>
  );
}
