
import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  className,
  children,
  onClick,
}: StatsCardProps) {
  return (
    <Card 
      className={cn("overflow-hidden", onClick && "hover:bg-gray-50", className)}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
