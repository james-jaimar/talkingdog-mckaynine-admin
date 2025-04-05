
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/components/messages/utils/messageFormatters";

interface MessageAvatarProps {
  name: string;
  isFromClient: boolean;
}

export function MessageAvatar({ name, isFromClient }: MessageAvatarProps) {
  return (
    <Avatar className="h-8 w-8 mt-1">
      <AvatarFallback className={isFromClient ? "bg-gray-200" : "bg-mckaynine-200"}>
        {getInitials(isFromClient ? name : 'S')}
      </AvatarFallback>
    </Avatar>
  );
}
