
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import { BadgeProps } from "./badge";

// Create a type that extends the original variants with our new ones
export type ExtendedBadgeVariant = 
  | "default" 
  | "secondary" 
  | "destructive" 
  | "outline" 
  | "warning" 
  | "info" 
  | "success"
  | "amber"
  | "green";

// Modify interface to use our extended variant type
export interface ExtendedBadgeProps extends Omit<BadgeProps, 'variant'> {
  variant?: ExtendedBadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: ExtendedBadgeProps) {
  const variantClasses = {
    warning: "border-transparent bg-amber-500 text-white hover:bg-amber-600",
    info: "border-transparent bg-blue-500 text-white hover:bg-blue-600",
    success: "border-transparent bg-green-500 text-white hover:bg-green-600",
    amber: "border-transparent bg-amber-500 text-white hover:bg-amber-600",
    green: "border-transparent bg-green-500 text-white hover:bg-green-600",
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

// Additionally export the ExtendedBadge with a different name to avoid collision
export { Badge as ExtendedBadge };
