
import { ClientMessage } from "@/components/messages/types";

interface MessageContentProps {
  message: ClientMessage;
  isFromClient: boolean;
}

export function MessageContent({ message, isFromClient }: MessageContentProps) {
  return (
    <div
      className={`rounded-lg p-3 ${
        isFromClient
          ? 'bg-gray-100 text-gray-800'
          : 'bg-mckaynine-600 text-white'
      }`}
    >
      {message.content}
    </div>
  );
}
