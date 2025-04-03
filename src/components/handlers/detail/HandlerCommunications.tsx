
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageComposer } from "@/components/messages/components/MessageComposer";
import { MessagesContainer } from "@/components/messages/components/MessagesContainer";
import { useClientMessages } from "@/components/messages/hooks/useClientMessages";

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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 border-b">
        <CardTitle>Communications</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <MessagesContainer 
          messages={messages}
          isLoading={isLoading}
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
