
import { ClientMessage } from "@/components/messages/types";
import { MessageAvatar } from "./message-parts/MessageAvatar";
import { MessageContent } from "./message-parts/MessageContent";
import { MessageMetadata } from "./message-parts/MessageMetadata";

interface MessageBubbleProps {
  message: ClientMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  // Important: Make sure we're correctly determining message source
  const isFromClient = message.is_from_client === true;
  const senderName = message.sender_name || (isFromClient ? 'User' : 'Staff');
  
  // Add debug output to help diagnose issues
  console.log("Message data:", { 
    id: message.id,
    isFromClient, 
    senderName,
    content: message.content.substring(0, 20) + "...",
    rawIsFromClient: message.is_from_client 
  });
  
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
