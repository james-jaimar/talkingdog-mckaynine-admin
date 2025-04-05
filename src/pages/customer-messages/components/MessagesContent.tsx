
import { ConversationView } from "@/components/messages/components/ConversationView";
import { ClientMessage } from "@/components/messages/types";

interface MessagesContentProps {
  messages: ClientMessage[];
  newMessage: string;
  setNewMessage: (value: string) => void;
  isLoading: boolean;
  isSending: boolean;
  sendMessage: () => void;
  clientId: string | null;
}

export function MessagesContent({
  messages,
  newMessage,
  setNewMessage,
  isLoading,
  isSending,
  sendMessage,
  clientId
}: MessagesContentProps) {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <div className="max-w-4xl mx-auto h-[600px]">
        <ConversationView
          title="Staff Communication"
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          isLoading={isLoading}
          isSending={isSending}
          sendMessage={sendMessage}
          emptyStateMessage="No messages yet. Send a message to contact our staff."
          clientId={clientId} // Pass client ID to mark messages as read
        />
      </div>
    </div>
  );
}
