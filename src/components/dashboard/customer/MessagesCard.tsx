
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";

interface MessagesCardProps {
  unreadMessageCount: number;
}

export function MessagesCard({ unreadMessageCount }: MessagesCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <MessageSquare className="h-4 w-4 mr-2 text-mckaynine-600" />
          Messages
          {unreadMessageCount > 0 && (
            <Badge variant="destructive" className="ml-2 px-1.5 py-0.5">
              {unreadMessageCount} new
            </Badge>
          )}
        </CardTitle>
        <CardDescription>View your conversations</CardDescription>
      </CardHeader>
      <CardContent>
        {unreadMessageCount > 0 ? (
          <p className="text-gray-700">You have {unreadMessageCount} unread {unreadMessageCount === 1 ? 'message' : 'messages'}</p>
        ) : (
          <p className="text-gray-500">No unread messages</p>
        )}
        <div className="mt-4">
          <Button 
            variant={unreadMessageCount > 0 ? "default" : "outline"} 
            size="sm" 
            className={unreadMessageCount > 0 ? "bg-mckaynine-600 hover:bg-mckaynine-700" : ""}
            asChild
          >
            <Link to="/customer/messages">View Messages</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
