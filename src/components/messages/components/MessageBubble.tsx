
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientMessage } from "@/components/messages/types";
import { formatMessageTime, getInitials } from "@/components/messages/utils/messageFormatters";

interface MessageBubbleProps {
  message: ClientMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div 
      className={`flex ${message.is_from_client ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`flex ${message.is_from_client ? 'flex-row' : 'flex-row-reverse'} max-w-[80%] gap-2`}>
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback className={message.is_from_client ? "bg-mckaynine-100" : "bg-blue-100"}>
            {getInitials(message.sender_name || 'User')}
          </AvatarFallback>
        </Avatar>
        <div>
          <div
            className={`rounded-lg p-3 ${
              message.is_from_client
                ? 'bg-gray-100 text-gray-800'
                : 'bg-mckaynine-600 text-white'
            }`}
          >
            {message.content}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {message.sender_name} · {formatMessageTime(message.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}
