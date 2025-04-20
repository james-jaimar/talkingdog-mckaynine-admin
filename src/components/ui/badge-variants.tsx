import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const extendedBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "text-foreground bg-white border",
        amber: "bg-amber-100 text-amber-800 border border-amber-200",
        green: "bg-green-100 text-green-800 border border-green-200",
        red: "bg-red-100 text-red-800 border border-red-200",
        purple: "bg-purple-100 text-purple-800 border border-purple-200",
        indigo: "bg-indigo-100 text-indigo-800 border border-indigo-200",
        blue: "bg-blue-100 text-blue-800 border border-blue-200", // Added blue variant
        gray: "bg-gray-100 text-gray-800 border border-gray-200"
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-0.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ExtendedBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof extendedBadgeVariants> {}

export function ExtendedBadge({
  className,
  variant,
  size,
  ...props
}: ExtendedBadgeProps) {
  return (
    <div
      className={cn(extendedBadgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}
