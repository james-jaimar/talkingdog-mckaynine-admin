
import { useClientMessages } from "@/components/messages/hooks/useClientMessages";
import { ConversationView } from "@/components/messages/components/ConversationView";

interface HandlerCommunicationsProps {
  clientId: string;
  clientName: string;
}

export function HandlerCommunications({ clientId, clientName }: HandlerCommunicationsProps) {
  const {
    messages,
    newMessage,
    setNewMessage,
    isLoading,
    isSending,
    sendMessage
  } = useClientMessages({ clientId, clientName });

  return (
    <ConversationView
      title="Communications"
      messages={messages}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      isLoading={isLoading}
      isSending={isSending}
      sendMessage={sendMessage}
      emptyStateMessage="No messages yet. Send a message to start the conversation with this handler."
    />
  );
}
