
import { formatMessageTime } from "@/components/messages/utils/messageFormatters";

interface MessageMetadataProps {
  senderName: string;
  timestamp: string;
}

export function MessageMetadata({ senderName, timestamp }: MessageMetadataProps) {
  return (
    <div className="text-xs text-gray-500 mt-1">
      {senderName} · {formatMessageTime(timestamp)}
    </div>
  );
}
