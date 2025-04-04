
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/components/messages/utils/messageFormatters";

interface MessageAvatarProps {
  name: string;
  isFromClient: boolean;
}

export function MessageAvatar({ name, isFromClient }: MessageAvatarProps) {
  return (
    <Avatar className="h-8 w-8 mt-1">
      <AvatarFallback className={isFromClient ? "bg-mckaynine-100" : "bg-blue-100"}>
        {getInitials(name || 'User')}
      </AvatarFallback>
    </Avatar>
  );
}
