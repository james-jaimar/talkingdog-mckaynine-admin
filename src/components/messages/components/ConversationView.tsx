
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageComposer } from "./MessageComposer";
import { MessagesContainer } from "./MessagesContainer";
import { ClientMessage } from "../types";

interface ConversationViewProps {
  title?: string;
  messages: ClientMessage[];
  newMessage: string;
  setNewMessage: (value: string) => void;
  isLoading: boolean;
  isSending: boolean;
  sendMessage: () => void;
  emptyStateMessage?: string;
}

export function ConversationView({
  title = "Conversation",
  messages,
  newMessage,
  setNewMessage,
  isLoading,
  isSending,
  sendMessage,
  emptyStateMessage = "No messages yet. Send a message to start the conversation."
}: ConversationViewProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 border-b">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <MessagesContainer 
          messages={messages}
          isLoading={isLoading}
          emptyStateMessage={emptyStateMessage}
        />
        
        <MessageComposer
          value={newMessage}
          onChange={setNewMessage}
          onSend={sendMessage}
          isSending={isSending}
        />
      </CardContent>
    </Card>
  );
}
