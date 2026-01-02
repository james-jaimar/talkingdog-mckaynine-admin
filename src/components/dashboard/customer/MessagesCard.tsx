import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, FileText, ChevronRight, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MessagesCardProps {
  unreadMessageCount?: number;
}

export function MessagesCard({ unreadMessageCount = 0 }: MessagesCardProps) {
  const navigate = useNavigate();

  const items = [
    {
      icon: MessageSquare,
      label: "Messages",
      description: unreadMessageCount > 0 ? `${unreadMessageCount} unread` : "Chat with trainers",
      badge: unreadMessageCount,
      badgeColor: "bg-mckaynine-500",
      onClick: () => navigate('/customer/messages'),
      iconBg: "bg-mckaynine-500/10",
      iconColor: "text-mckaynine-500",
    },
    {
      icon: FileText,
      label: "Invoices",
      description: "View payment history",
      badge: 0,
      badgeColor: "",
      onClick: () => navigate('/customer/invoices'),
      iconBg: "bg-green-500/10",
      iconColor: "text-green-600",
    },
  ];

  return (
    <Card className="bg-customer-card border-0 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-mckaynine-500/10 to-mckaynine-500/5 px-5 py-4 border-b border-mckaynine-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mckaynine-500/20 flex items-center justify-center relative">
            <Bell className="h-5 w-5 text-mckaynine-500" />
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full border-2 border-customer-card" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              Messages & billing
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-3">
        <div className="space-y-1">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                "hover:bg-muted/50 group text-left"
              )}
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", item.iconBg)}>
                <item.icon className={cn("h-5 w-5", item.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{item.label}</span>
                  {item.badge > 0 && (
                    <Badge className={cn("text-xs px-1.5 py-0", item.badgeColor)}>
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
