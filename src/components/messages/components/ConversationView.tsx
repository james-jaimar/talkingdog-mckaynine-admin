
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageComposer } from "./MessageComposer";
import { MessagesContainer } from "./MessagesContainer";
import { ClientMessage } from "../types";
import { useEffect } from "react";
import { markMessagesAsRead } from "../services/messageApi";

interface ConversationViewProps {
  title?: string;
  messages: ClientMessage[];
  newMessage: string;
  setNewMessage: (value: string) => void;
  isLoading: boolean;
  isSending: boolean;
  sendMessage: () => void;
  emptyStateMessage?: string;
  clientId?: string; // Added client ID to mark messages as read
}

export function ConversationView({
  title = "Conversation",
  messages,
  newMessage,
  setNewMessage,
  isLoading,
  isSending,
  sendMessage,
  emptyStateMessage = "No messages yet. Send a message to start the conversation.",
  clientId
}: ConversationViewProps) {
  // Mark messages as read when conversation is viewed
  useEffect(() => {
    const markAsRead = async () => {
      if (clientId && messages.length > 0 && !isLoading) {
        // Filter staff messages only (those not from client) that are unread
        const unreadStaffMessageIds = messages
          .filter(msg => !msg.is_from_client && !msg.is_read)
          .map(msg => msg.id);
          
        if (unreadStaffMessageIds.length > 0) {
          try {
            console.log(`Marking ${unreadStaffMessageIds.length} messages as read for client ${clientId}`);
            await markMessagesAsRead(clientId, unreadStaffMessageIds);
          } catch (error) {
            console.error("Failed to mark messages as read:", error);
          }
        }
      }
    };
    
    markAsRead();
  }, [messages, isLoading, clientId]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 border-b">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <MessagesContainer 
          messages={messages}
          isLoading={isLoading}
          emptyStateMessage={emptyStateMessage}
        />
        
        <div className="mt-auto border-t">
          <MessageComposer
            value={newMessage}
            onChange={setNewMessage}
            onSend={sendMessage}
            isSending={isSending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
