
import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OptionType } from "./types";

interface MultiSelectBadgeProps {
  item: OptionType;
  index: number;
  onUnselect: (item: OptionType) => void;
}

export function MultiSelectBadge({ item, index, onUnselect }: MultiSelectBadgeProps) {
  const handleUnselect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUnselect(item);
  };

  return (
    <Badge
      variant="secondary"
      className="mr-1 mb-1"
    >
      {item.label}
      <button
        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onClick={handleUnselect}
        type="button"
      >
        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        <span className="sr-only">Remove {item.label}</span>
      </button>
    </Badge>
  );
}
