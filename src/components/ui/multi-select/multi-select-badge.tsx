
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
  // Safely handle possibly undefined/invalid item
  const safeItem = React.useMemo(() => {
    if (!item || typeof item !== 'object') {
      console.warn("MultiSelectBadge: received invalid item:", item);
      return { label: "Unknown", value: `unknown-${index}` };
    }
    return {
      label: typeof item.label === 'string' ? item.label : "Unknown",
      value: typeof item.value === 'string' ? item.value : `unknown-${index}`,
    };
  }, [item, index]);

  const handleUnselect = React.useCallback(() => {
    try {
      onUnselect(safeItem);
    } catch (error) {
      console.error("Error in MultiSelectBadge handleUnselect:", error);
    }
  }, [safeItem, onUnselect]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    try {
      if (e.key === "Enter") {
        handleUnselect();
      }
    } catch (error) {
      console.error("Error in MultiSelectBadge handleKeyDown:", error);
    }
  }, [handleUnselect]);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
    } catch (error) {
      console.error("Error in MultiSelectBadge handleMouseDown:", error);
    }
  }, []);

  return (
    <Badge
      key={`item-${safeItem.value}-${safeItem.label}`}
      variant="secondary"
      className="mr-1 mb-1"
    >
      {safeItem.label}
      <button
        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        onClick={handleUnselect}
        type="button"
      >
        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        <span className="sr-only">Remove {safeItem.label}</span>
      </button>
    </Badge>
  );
}
