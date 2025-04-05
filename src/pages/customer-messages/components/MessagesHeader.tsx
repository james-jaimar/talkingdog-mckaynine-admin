
import { Helmet } from "react-helmet";
import { Badge } from "@/components/ui/badge";

interface MessagesHeaderProps {
  unreadCount?: number;
}

export function MessagesHeader({ unreadCount = 0 }: MessagesHeaderProps) {
  return (
    <>
      <Helmet>
        <title>Messages - McKaynine Training Centre</title>
      </Helmet>
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="ml-2">
            {unreadCount} unread
          </Badge>
        )}
      </div>
    </>
  );
}
