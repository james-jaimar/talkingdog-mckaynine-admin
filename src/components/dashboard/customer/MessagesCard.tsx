
// Import statements stay the same
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MessagesCardProps {
  unreadMessageCount?: number;
}

export function MessagesCard({ unreadMessageCount = 0 }: MessagesCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Communication</CardTitle>
        <CardDescription>Messages and invoices</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium">Messages</span>
            {unreadMessageCount > 0 && (
              <Badge className="ml-2 bg-blue-600">{unreadMessageCount}</Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/customer/messages')}
          >
            View
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-green-600 mr-2" />
            <span className="font-medium">Invoices</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/customer/invoices')}
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
