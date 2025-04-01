
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import { BadgeProps } from "./badge";

interface ExtendedBadgeProps extends BadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline" | "warning" | "info" | "success";
}

export function ExtendedBadge({ className, variant = "default", ...props }: ExtendedBadgeProps) {
  const variantClasses = {
    warning: "border-transparent bg-amber-500 text-white hover:bg-amber-600",
    info: "border-transparent bg-mckaynine-500 text-white hover:bg-mckaynine-600",
    success: "border-transparent bg-green-500 text-white hover:bg-green-600",
  };

  // Use the built-in variants for the standard ones
  if (["default", "secondary", "destructive", "outline"].includes(variant)) {
    return <Badge variant={variant as any} className={className} {...props} />;
  }

  // Use our custom variant
  return (
    <Badge 
      variant="outline"
      className={cn(
        variantClasses[variant as keyof typeof variantClasses], 
        className
      )} 
      {...props} 
    />
  );
}
